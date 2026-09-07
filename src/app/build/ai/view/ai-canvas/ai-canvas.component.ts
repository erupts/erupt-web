import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {SharedModule} from '@shared/shared.module';
import {I18NService} from '@core';
import {NzCodeEditorModule} from 'ng-zorro-antd/code-editor';
import {CanvasApiService, CanvasGenerating, CanvasInfo, CanvasStyle, CanvasVersion, Llm, ModelGroup, CanvasModel} from '../../service/canvas-api.service';

/** Element picked from the preview iframe, referenced in the next generation round */
interface PickedElement {
    selector: string;
    tag: string;
}

/**
 * AI view designer: preview on the left, generation conversation on the right.
 * Each user message produces a new page version; versions are switchable as the
 * working draft. Viewers only see the draft after an explicit publish.
 */
@Component({
    standalone: true,
    selector: 'erupt-ai-canvas',
    templateUrl: './ai-canvas.component.html',
    styleUrls: ['./ai-canvas.component.less'],
    imports: [SharedModule, NzCodeEditorModule],
    providers: [CanvasApiService]
})
export class AiCanvasComponent implements OnInit, OnDestroy {

    @ViewChild('bubblesRef') bubblesRef?: ElementRef<HTMLDivElement>;

    @ViewChild('sourceTpl') sourceTpl?: any;

    @ViewChild('frameRef') frameRef?: ElementRef<HTMLIFrameElement>;

    /** Short unique code, path segment of the end-user access route #/ai/canvas/{code} */
    code!: string;

    /** Preview viewport width: desktop fills the pane, tablet/mobile simulate devices */
    device: 'desktop' | 'tablet' | 'mobile' = 'desktop';

    static readonly DEVICE_WIDTHS: Record<string, string | null> = {desktop: null, tablet: '768px', mobile: '390px'};

    get deviceWidth(): string | null {
        return AiCanvasComponent.DEVICE_WIDTHS[this.device];
    }

    /** True while the iframe is loading after a refresh, drives the overlay spinner */
    iframeLoading = false;

    /** Page source shown in the source modal's code editor */
    sourceRaw = '';

    /** Monaco options for the readonly source viewer, same editor as erupt CODE_EDITOR fields */
    readonly sourceEditorOption = {
        language: 'html',
        readOnly: true,
        minimap: {enabled: false},
        scrollBeyondLastLine: false,
        automaticLayout: true
    };

    name = '';

    /** Data models bound on the AiCanvas record, read-only here */
    models: CanvasModel[] = [];

    style: string | null = null;

    /** Chat model for the next generation; null uses the default chat model */
    llmId: number | null = null;

    modelGroups: ModelGroup[] = [];

    styles: CanvasStyle[] = [];

    llms: Llm[] = [];

    versions: CanvasVersion[] = [];

    activeVersion: number | null = null;

    /** Version currently live for viewers; null until the first publish */
    publishVersion: number | null = null;

    publishing = false;

    content = '';

    generating = false;

    loading = true;

    previewHtml: SafeHtml | null = null;

    /** Runtime errors relayed by the SDK from the preview iframe (postMessage), cleared on reload */
    pageErrors: string[] = [];

    static readonly MAX_PAGE_ERRORS = 5;

    /**
     * True while showing a round this designer did not start: it was already running
     * when the page was opened (or reloaded mid-round). Same polling either way, the
     * flag only drives the explanatory note in the progress bubble.
     */
    detached = false;

    /** Epoch millis the running round started, from the backend marker */
    generatingSince: number | null = null;

    private pollTimer: any = null;

    static readonly POLL_INTERVAL = 3000;

    /** 1s ticker while a round runs so the elapsed time in the bubble keeps moving between polls */
    private elapsedTimer: any = null;

    /** True while element-pick mode is active on the preview iframe */
    picking = false;

    /** Element picked from the preview, shown as a reference chip above the input */
    picked: PickedElement | null = null;

    /** Removes pick-mode listeners and overlay from the iframe document */
    private detachPicker: (() => void) | null = null;

    /** Message of the running round, restored to the input on failure/cancel */
    private pendingMessage = '';

    private pendingPicked: PickedElement | null = null;

    get pendingRequirement(): string {
        return this.pendingMessage;
    }

    constructor(
        private api: CanvasApiService,
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer,
        private message: NzMessageService,
        private modal: NzModalService,
        private i18n: I18NService,
        private ngZone: NgZone,
        private location: Location
    ) {
    }

    goBack(): void {
        this.location.back();
    }

    ngOnDestroy(): void {
        this.stopPolling();
        this.exitPick();
        window.removeEventListener('message', this.onFrameMessage);
    }

    ngOnInit(): void {
        window.addEventListener('message', this.onFrameMessage);
        this.code = this.route.snapshot.params['code'];
        this.api.models().subscribe(res => this.modelGroups = res.data || []);
        this.api.styles().subscribe(res => this.styles = res.data || []);
        this.api.llms().subscribe(res => this.llms = res.data || []);
        this.api.info(this.code).subscribe({
            next: res => {
                this.loading = false;
                this.applyInfo(res.data);
                this.scrollBubblesToBottom();
            },
            error: () => this.loading = false
        });
    }

    private applyInfo(info: CanvasInfo): void {
        this.name = info.name;
        this.style = info.style;
        this.llmId = info.llmId;
        this.versions = info.versions || [];
        this.activeVersion = info.activeVersion;
        this.publishVersion = info.publishVersion;
        this.models = info.models || [];
        if (this.activeVersion) {
            this.refreshPreview();
        }
        if (info.generating?.error) {
            // The last round failed while nobody was watching; the marker is consumed by this read
            this.message.error(info.generating.error);
            this.stopPolling();
        } else if (info.generating) {
            this.attachToRunningRound(info.generating);
        } else {
            this.stopPolling();
        }
    }

    /**
     * Show a round that was already running when the designer opened. Requirement and
     * start time come from the backend marker; completion is detected by polling, exactly
     * like a round started here.
     */
    private attachToRunningRound(state: CanvasGenerating): void {
        this.generating = true;
        this.detached = true;
        this.generatingSince = state.startedAt;
        this.pendingMessage = state.message || '';
        this.startPolling();
    }

    /** Poll the running marker until it is gone (version filed) or reports a failure */
    private startPolling(): void {
        if (!this.elapsedTimer) this.elapsedTimer = setInterval(() => void 0, 1000);
        if (this.pollTimer) return;
        this.pollTimer = setInterval(() => {
            this.api.generating(this.code).subscribe({
                next: res => {
                    if (!res.data || res.data.error) this.onRoundEnded(res.data?.error || null);
                },
                // A failing poll must not strand the designer in a generating state
                error: () => this.onRoundEnded(null)
            });
        }, AiCanvasComponent.POLL_INTERVAL);
    }

    private stopPolling(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        if (this.elapsedTimer) {
            clearInterval(this.elapsedTimer);
            this.elapsedTimer = null;
        }
    }

    /**
     * The round is over. On failure the message goes back into the input (when this
     * designer wrote it); otherwise reload to pick up whatever version got filed.
     */
    private onRoundEnded(error: string | null): void {
        this.stopPolling();
        const before = this.versions.length;
        const startedHere = !this.detached;
        this.detached = false;
        this.generating = false;
        this.generatingSince = null;
        if (error) {
            this.message.error(error);
            if (startedHere) this.restorePending();
            this.pendingMessage = '';
            return;
        }
        this.pendingMessage = '';
        this.api.info(this.code).subscribe({
            next: res => {
                this.applyInfo(res.data);
                if (this.versions.length > before) {
                    this.message.success(this.i18n.fanyi('ai.canvas.generated'));
                } else {
                    // Finished with nothing filed: stopped elsewhere
                    this.message.info(this.i18n.fanyi('ai.canvas.round_ended_empty'));
                }
                this.scrollBubblesToBottom();
            }
        });
    }

    /** Whole minutes and seconds the running round has been going, for the progress bubble */
    get generatingElapsed(): string {
        if (!this.generatingSince) return '';
        const secs = Math.max(0, Math.floor((Date.now() - this.generatingSince) / 1000));
        return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m${String(secs % 60).padStart(2, '0')}s`;
    }

    get activeVersionNo(): number | null {
        return this.versions.find(v => v.id === this.activeVersion)?.version ?? null;
    }

    styleName(id: string | null): string | null {
        if (!id) return null;
        return this.styles.find(s => s.id === id)?.name ?? id;
    }

    /** Currently selected style, drives the hint strip above the input */
    get selectedStyle(): CanvasStyle | undefined {
        return this.style ? this.styles.find(s => s.id === this.style) : undefined;
    }

    /** Display label of a bound data model, resolved against the provider catalog */
    modelLabel(binding: CanvasModel): string {
        const group = this.modelGroups.find(g => g.type === binding.dataType);
        const model = group?.models.find(m => m.value === binding.model);
        return model ? model.label : binding.model;
    }

    /** Hover text of a model chip: type / code, allowed writes, plus the purpose hint when set */
    modelTitle(binding: CanvasModel): string {
        const writes = binding.writes && binding.writes.length ? binding.writes.join(' / ') : 'read-only';
        const head = `${binding.dataType} / ${binding.model} (${writes})`;
        return binding.purpose ? `${head}\n${binding.purpose}` : head;
    }

    /** End-user access URL of this page, served by the frontend route */
    private accessUrl(): string {
        return `${location.origin}${location.pathname}${location.search}#/ai/canvas/${this.code}`;
    }

    /** The draft may differ from what viewers see until it is published again */
    get unpublishedChanges(): boolean {
        return this.activeVersion != null && this.activeVersion !== this.publishVersion;
    }

    publish(): void {
        if (this.publishing || !this.activeVersion) return;
        this.publishing = true;
        this.api.publish(this.code).subscribe({
            next: () => {
                this.publishing = false;
                this.publishVersion = this.activeVersion;
                this.message.success(this.i18n.fanyi('ai.canvas.publish_success'));
            },
            error: () => this.publishing = false
        });
    }

    /** Errors the SDK inside the preview relays; only messages from our own iframe count */
    private onFrameMessage = (e: MessageEvent): void => {
        if (e.source !== this.frameRef?.nativeElement.contentWindow) return;
        const data = e.data;
        if (!data || data.type !== 'erupt-canvas-error' || typeof data.message !== 'string') return;
        if (this.pageErrors.length >= AiCanvasComponent.MAX_PAGE_ERRORS || this.pageErrors.includes(data.message)) return;
        this.ngZone.run(() => this.pageErrors.push(data.message));
    };

    /** Hand the collected page errors to the model as the next round */
    fixErrors(): void {
        if (this.generating || !this.pageErrors.length) return;
        this.content = 'The page reports these runtime errors:\n'
            + this.pageErrors.map(err => '- ' + err).join('\n')
            + '\nFix them so the page renders and works correctly.';
        this.pageErrors = [];
        this.send();
    }


    refreshPreview(): void {
        this.exitPick();
        this.pageErrors = [];
        this.iframeLoading = true;
        this.api.preview(this.code).subscribe({
            next: html => {
                this.sourceRaw = html || '';
                this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(this.sourceRaw);
            },
            error: () => this.iframeLoading = false
        });
    }

    /** Pick-mode listeners live in the iframe document, gone after each reload */
    onFrameLoad(): void {
        this.iframeLoading = false;
        this.exitPick();
    }

    // ---------- element pick mode ----------

    togglePick(): void {
        if (this.picking) {
            this.exitPick();
            return;
        }
        const doc = this.frameRef?.nativeElement?.contentDocument;
        if (!doc?.body) return;
        this.picking = true;
        this.attachPicker(doc);
    }

    exitPick(): void {
        this.detachPicker?.();
        this.detachPicker = null;
        this.picking = false;
    }

    private attachPicker(doc: Document): void {
        const overlay = doc.createElement('div');
        overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;display:none;'
            + 'border:1.5px solid #1890ff;background:rgba(24,144,255,.12);box-sizing:border-box;';
        const label = doc.createElement('span');
        label.style.cssText = 'position:absolute;left:-1.5px;bottom:100%;padding:1px 6px;'
            + 'background:#1890ff;color:#fff;font:11px/1.6 monospace;white-space:nowrap;';
        overlay.appendChild(label);
        doc.body.appendChild(overlay);

        const cursorStyle = doc.createElement('style');
        cursorStyle.textContent = '*{cursor:crosshair!important}';
        doc.head.appendChild(cursorStyle);

        const onOver = (ev: Event) => {
            const el = ev.target as Element;
            if (!el || el === overlay || el.tagName === 'HTML') return;
            const rect = el.getBoundingClientRect();
            overlay.style.display = 'block';
            overlay.style.left = rect.left + 'px';
            overlay.style.top = rect.top + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';
            label.textContent = el.tagName.toLowerCase();
        };
        const onScroll = () => overlay.style.display = 'none';
        const onClick = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
            const el = ev.target as Element;
            if (!el || el === overlay || el.tagName === 'HTML') return;
            // iframe listeners are outside the Angular zone (separate realm, unpatched by zone.js)
            this.ngZone.run(() => {
                this.picked = {
                    selector: AiCanvasComponent.cssPath(el),
                    tag: el.tagName.toLowerCase()
                };
                this.exitPick();
            });
        };
        doc.addEventListener('mouseover', onOver, true);
        doc.addEventListener('scroll', onScroll, true);
        doc.addEventListener('click', onClick, true);
        this.detachPicker = () => {
            doc.removeEventListener('mouseover', onOver, true);
            doc.removeEventListener('scroll', onScroll, true);
            doc.removeEventListener('click', onClick, true);
            overlay.remove();
            cursorStyle.remove();
        };
    }

    /** Shortest unique-enough CSS path: nearest #id anchor, then tag:nth-of-type segments */
    private static cssPath(el: Element): string {
        const parts: string[] = [];
        let node: Element | null = el;
        while (node && node.tagName !== 'HTML' && node.tagName !== 'BODY') {
            if (node.id) {
                parts.unshift('#' + node.id);
                return parts.join(' > ');
            }
            let seg = node.tagName.toLowerCase();
            const parent = node.parentElement;
            if (parent) {
                const sameTag = Array.from(parent.children).filter(c => c.tagName === node!.tagName);
                if (sameTag.length > 1) seg += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
            }
            parts.unshift(seg);
            node = parent;
        }
        return parts.join(' > ');
    }

    openInNew(): void {
        window.open(this.accessUrl());
    }

    setDevice(device: 'desktop' | 'tablet' | 'mobile'): void {
        this.device = device;
    }

    /** Copy the access URL — mount it as a menu or share to logged-in users */
    copyLink(): void {
        navigator.clipboard.writeText(this.accessUrl()).then(() =>
            this.message.success(this.i18n.fanyi('ai.canvas.link_copied')));
    }

    /** Show the active version's page source in a modal, in the readonly code editor */
    viewSource(): void {
        this.modal.create({
            nzTitle: this.i18n.fanyi('ai.canvas.source_title'),
            nzContent: this.sourceTpl,
            nzWidth: 900,
            nzFooter: null
        });
    }

    send(): void {
        const msg = this.content?.trim();
        if (!msg || this.generating) return;
        if (!this.models.length) {
            this.message.warning(this.i18n.fanyi('ai.canvas.model_not_configured'));
            return;
        }
        this.generating = true;
        this.detached = false;
        this.generatingSince = Date.now();
        this.stopPolling();
        this.pendingMessage = msg;
        this.pendingPicked = this.picked;
        // The picked element travels as its own params, not spliced into the message,
        // so the backend frames it as a targeted-edit instruction the model won't ignore
        const picked = this.picked;
        this.content = '';
        this.picked = null;
        this.scrollBubblesToBottom();
        this.api.generate(this.code, msg, this.style, this.llmId, picked?.selector ?? null).subscribe({
            // The round is open on the backend; follow it the same way a reloaded designer would
            next: () => this.startPolling(),
            error: () => {
                this.generating = false;
                this.generatingSince = null;
                this.restorePending();
            }
        });
    }

    /** Cancel the running generation: the explicit stop signal makes the backend
     *  discard the round — closing the connection alone would still persist it */
    stop(): void {
        this.api.stop(this.code).subscribe();
        this.stopPolling();
        this.generating = false;
        this.generatingSince = null;
        this.restorePending();
        this.detached = false;
    }

    private restorePending(): void {
        this.content = this.pendingMessage;
        this.picked = this.pendingPicked;
    }

    /** Pin the conversation pane to its latest bubble; deferred so the new bubble is rendered first */
    private scrollBubblesToBottom(): void {
        setTimeout(() => {
            const el = this.bubblesRef?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        });
    }

    activate(version: CanvasVersion): void {
        if (version.id === this.activeVersion || this.generating) return;
        this.api.active(this.code, version.id).subscribe(() => {
            this.activeVersion = version.id;
            // Mirror the backend: activating a version restores its style snapshot
            this.style = version.style;
            this.refreshPreview();
        });
    }

    onInputKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.send();
        }
    }

}
