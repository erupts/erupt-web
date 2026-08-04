import {Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {NzMessageService} from 'ng-zorro-antd/message';
import {SharedModule} from '@shared/shared.module';
import {I18NService} from '@core';
import {RestPath} from '../../../erupt/model/erupt.enum';
import {SseMessage, SseMessageEvent} from '../../model/chat.model';
import {CanvasApiService, CanvasInfo, CanvasStyle, CanvasVersion, ModelGroup} from '../../service/canvas-api.service';

/**
 * AI view designer: preview on the left, generation conversation on the right.
 * Each user message produces a new page version; versions are switchable.
 */
@Component({
    standalone: true,
    selector: 'erupt-ai-canvas',
    templateUrl: './ai-canvas.component.html',
    styleUrls: ['./ai-canvas.component.less'],
    imports: [SharedModule],
    providers: [CanvasApiService]
})
export class AiCanvasComponent implements OnInit, OnDestroy {

    @ViewChild('streamRef') streamRef?: ElementRef<HTMLPreElement>;

    canvasId!: number;

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

    previewUrl: SafeResourceUrl | null = null;

    /** Streaming code accumulated during generation, shown as live progress */
    streamingText = '';

    /** Message of the running round, restored to the input on failure/cancel */
    private pendingMessage = '';

    get pendingRequirement(): string {
        return this.pendingMessage;
    }

    private eventSource: EventSource | null = null;

    constructor(
        private api: CanvasApiService,
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer,
        private message: NzMessageService,
        private i18n: I18NService,
        private ngZone: NgZone,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
    }

    ngOnDestroy(): void {
        this.eventSource?.close();
    }

    ngOnInit(): void {
        this.canvasId = +this.route.snapshot.params['id'];
        this.api.models().subscribe(res => this.modelGroups = res.data || []);
        this.api.styles().subscribe(res => this.styles = res.data || []);
        this.api.info(this.canvasId).subscribe({
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

    private rawPreviewUrl(): string {
        const token = this.tokenService.get()?.token || '';
        return `${RestPath.erupt}/ai-canvas/render/${this.canvasId}?_token=${encodeURIComponent(token)}&_=${Date.now()}`;
    }

    refreshPreview(): void {
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPreviewUrl());
    }

    openInNew(): void {
        window.open(this.rawPreviewUrl());
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
        this.content = '';
        this.streamingText = '';
        const token = this.tokenService.get()?.token || '';
        this.eventSource = new EventSource(this.api.generateSseUrl(this.canvasId, msg, dataType, targetModel, this.style, token));
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
                        this.content = this.pendingMessage;
                    }
                });
            }
        };
        this.eventSource.onerror = () => {
            this.ngZone.run(() => {
                if (!this.generating) return;
                this.closeSse();
                this.message.error(this.i18n.fanyi('ai.canvas.stream_broken'));
                this.content = this.pendingMessage;
            });
        };
    }

    /** Cancel the running generation: the backend discards the round, no version is filed */
    stop(): void {
        this.closeSse();
        this.content = this.pendingMessage;
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
        this.api.active(this.canvasId, version.id).subscribe(() => {
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
