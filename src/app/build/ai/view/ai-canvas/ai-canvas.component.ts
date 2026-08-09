import {Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {SharedModule} from '@shared/shared.module';
import {I18NService} from '@core';
import {NzCodeEditorModule} from 'ng-zorro-antd/code-editor';
import {SseMessage, SseMessageEvent} from '../../model/chat.model';
import {CanvasApiService, CanvasInfo, CanvasStyle, CanvasVersion, ModelGroup} from '../../service/canvas-api.service';

/** Element picked from the preview iframe, referenced in the next generation round */
interface PickedElement {
    selector: string;
    tag: string;
    snippet: string;
}

/**
 * AI view designer: preview on the left, generation conversation on the right.
 * Each user message produces a new page version; versions are switchable.
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

    @ViewChild('streamRef') streamRef?: ElementRef<HTMLPreElement>;

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

    /** Combined data source selection: '<type>:<model>' */
    modelKey: string | null = null;

    style: string | null = null;

    modelGroups: ModelGroup[] = [];

    styles: CanvasStyle[] = [];

    versions: CanvasVersion[] = [];

    activeVersion: number | null = null;

    content = '';

    generating = false;

    loading = true;

    previewHtml: SafeHtml | null = null;

    /** Streaming code accumulated during generation, shown as live progress */
    streamingText = '';

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

    private eventSource: EventSource | null = null;

    constructor(
        private api: CanvasApiService,
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer,
        private message: NzMessageService,
        private modal: NzModalService,
        private i18n: I18NService,
        private ngZone: NgZone,
        private location: Location,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
    }

    goBack(): void {
        this.location.back();
    }

    ngOnDestroy(): void {
        this.eventSource?.close();
        this.exitPick();
    }

    ngOnInit(): void {
        this.code = this.route.snapshot.params['code'];
        this.api.models().subscribe(res => this.modelGroups = res.data || []);
        this.api.styles().subscribe(res => this.styles = res.data || []);
        this.api.info(this.code).subscribe({
            next: res => {
                this.loading = false;
                this.applyInfo(res.data);
            },
            error: () => this.loading = false
        });
    }

    private applyInfo(info: CanvasInfo): void {
        this.name = info.name;
        this.style = info.style;
        this.versions = info.versions || [];
        this.activeVersion = info.activeVersion;
        if (info.dataType && info.targetModel) {
            this.modelKey = `${info.dataType}:${info.targetModel}`;
        }
        if (this.activeVersion) {
            this.refreshPreview();
        }
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

    modelLabel(version: CanvasVersion): string {
        const group = this.modelGroups.find(g => g.type === version.dataType);
        const model = group?.models.find(m => m.value === version.targetModel);
        return model ? model.label : version.targetModel;
    }

    /** End-user access URL of this page, served by the frontend route */
    private accessUrl(): string {
        return `${location.origin}${location.pathname}${location.search}#/ai/canvas/${this.code}`;
    }

    refreshPreview(): void {
        this.exitPick();
        this.iframeLoading = true;
        this.api.html(this.code).subscribe({
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
            const html = el.outerHTML || '';
            // iframe listeners are outside the Angular zone (separate realm, unpatched by zone.js)
            this.ngZone.run(() => {
                this.picked = {
                    selector: AiCanvasComponent.cssPath(el),
                    tag: el.tagName.toLowerCase(),
                    snippet: html.length > 600 ? html.slice(0, 600) + '…' : html
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
        if (!this.modelKey) {
            this.message.warning(this.i18n.fanyi('ai.canvas.select_model_first'));
            return;
        }
        const sep = this.modelKey.indexOf(':');
        const dataType = this.modelKey.substring(0, sep);
        const targetModel = this.modelKey.substring(sep + 1);
        this.generating = true;
        this.pendingMessage = msg;
        this.pendingPicked = this.picked;
        // Append the picked element as context so the model knows what "this" refers to
        const fullMsg = this.picked
            ? `${msg}\n\n[selected element] ${this.picked.selector}\n\`\`\`html\n${this.picked.snippet}\n\`\`\``
            : msg;
        this.content = '';
        this.picked = null;
        this.streamingText = '';
        const token = this.tokenService.get()?.token || '';
        this.eventSource = new EventSource(this.api.generateSseUrl(this.code, fullMsg, dataType, targetModel, this.style, token));
        this.eventSource.onmessage = event => {
            const body: SseMessage = JSON.parse(event.data);
            if (body.event === SseMessageEvent.TOKEN && body.data) {
                this.ngZone.run(() => {
                    this.streamingText += body.data;
                    this.scrollStreamToBottom();
                });
            } else if (body.event === SseMessageEvent.DONE) {
                const payload = body.data ? JSON.parse(body.data) : {};
                this.ngZone.run(() => {
                    this.closeSse();
                    if (payload.version) {
                        this.versions.push(payload.version);
                        this.activeVersion = payload.version.id;
                        this.refreshPreview();
                    } else {
                        this.message.error(payload.error || 'Generation failed');
                        this.restorePending();
                    }
                });
            }
        };
        this.eventSource.onerror = () => {
            this.ngZone.run(() => {
                if (!this.generating) return;
                this.closeSse();
                this.message.error(this.i18n.fanyi('ai.canvas.stream_broken'));
                this.restorePending();
            });
        };
    }

    /** Cancel the running generation: the explicit stop signal makes the backend
     *  discard the round — closing the connection alone would still persist it */
    stop(): void {
        this.api.stop(this.code).subscribe();
        this.closeSse();
        this.restorePending();
    }

    private restorePending(): void {
        this.content = this.pendingMessage;
        this.picked = this.pendingPicked;
    }

    private closeSse(): void {
        this.eventSource?.close();
        this.eventSource = null;
        this.generating = false;
        this.streamingText = '';
    }

    /** Tail of the streaming output shown in the progress bubble, kept short to stay light */
    get streamTail(): string {
        return this.streamingText.length > 1500 ? this.streamingText.slice(-1500) : this.streamingText;
    }

    private scrollStreamToBottom(): void {
        const el = this.streamRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }

    activate(version: CanvasVersion): void {
        if (version.id === this.activeVersion || this.generating) return;
        this.api.active(this.code, version.id).subscribe(() => {
            this.activeVersion = version.id;
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
