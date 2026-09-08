import {
    Component,
    ElementRef,
    Inject,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {ReuseTabService} from '@delon/abc/reuse-tab';
import {leaveReuseTab} from '@core';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import RFB from '@novnc/novnc/lib/rfb.js';
import {Status} from '../../../erupt/model/erupt-api.model';
import {RemoteApiService} from '../../service/remote-api.service';
import {ConnState, describeClose, remoteWsUrl} from '../../model/remote.model';

type Menu = 'keys' | 'quality' | 'power' | null;

// X11 keysyms used by the extra-keys menu
const XK = {Escape: 0xff1b, Tab: 0xff09, Super_L: 0xffeb, Alt_L: 0xffe9, Control_L: 0xffe3, F11: 0xffc8, Print: 0xff61};

const QUALITY_PRESETS: { key: string; label: string; quality: number; compression: number }[] = [
    {key: 'low', label: 'Low bandwidth', quality: 2, compression: 9},
    {key: 'medium', label: 'Balanced', quality: 6, compression: 2},
    {key: 'high', label: 'Best quality', quality: 9, compression: 0}
];

@Component({
    standalone: false,
    selector: 'app-remote-desktop',
    templateUrl: './desktop.component.html',
    styleUrls: ['./desktop.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class DesktopComponent implements OnInit, OnDestroy {

    @ViewChild('shell', {static: true}) shellEl!: ElementRef<HTMLDivElement>;
    @ViewChild('screen', {static: true}) screenEl!: ElementRef<HTMLDivElement>;

    readonly qualityPresets = QUALITY_PRESETS;

    @Input() hostId!: string;
    @Input() hostName = '';
    /** Ticket already issued by the entry component; used for the first connection only */
    @Input() initialTicket: string | null = null;

    desktopName = '';
    state: ConnState = 'connecting';
    statusText = 'Requesting session…';
    viewOnly = false;
    scaleToFit = true;
    fullscreen = false;
    powerSupported = false;
    qualityKey = 'medium';
    openMenu: Menu = null;
    toast = '';

    credentials = {visible: false, needUsername: false, username: '', password: ''};

    private rfb: RFB | null = null;
    private lastClose: { code: number; reason: string } | null = null;
    private securityReason = '';
    private toastTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly onFullscreenChange = () => this.ngZone.run(() => this.fullscreen = !!document.fullscreenElement);
    private readonly onDocumentClick = (e: MouseEvent) => {
        if (this.openMenu && !(e.target as HTMLElement).closest('.menu-wrap')) {
            this.ngZone.run(() => this.openMenu = null);
        }
    };
    private readonly onPaste = (e: ClipboardEvent) => {
        if (this.credentials.visible || !this.rfb || this.state !== 'connected') return;
        const text = e.clipboardData?.getData('text');
        if (text) this.rfb.clipboardPasteFrom(text);
    };

    constructor(
        private router: Router,
        private location: Location,
        private api: RemoteApiService,
        private ngZone: NgZone,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private reuseTab: ReuseTabService
    ) {
    }

    ngOnInit(): void {
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('paste', this.onPaste);
        this.connect();
    }

    // ------------------------------------------------------------------ connection

    connect(): void {
        this.state = 'connecting';
        this.lastClose = null;
        this.securityReason = '';
        if (this.initialTicket) {
            const ticket = this.initialTicket;
            this.initialTicket = null;
            this.statusText = `Connecting to ${this.hostName}…`;
            this.open(ticket);
            return;
        }
        this.statusText = 'Requesting session…';
        this.api.ticket(this.hostId).subscribe({
            next: res => {
                if (res.status !== Status.SUCCESS || !res.data) {
                    this.fail(res.message || 'Failed to obtain a session ticket');
                    return;
                }
                this.hostName = res.data.name;
                this.statusText = `Connecting to ${this.hostName}…`;
                this.open(res.data.ticket);
            },
            error: () => this.fail('Failed to obtain a session ticket')
        });
    }

    private open(ticket: string): void {
        const url = remoteWsUrl(this.tokenService.get()?.token || '', ticket);
        this.ngZone.runOutsideAngular(() => {
            // Own the socket so the server's close code is observable; noVNC only reports clean/unclean
            const ws = new WebSocket(url);
            ws.binaryType = 'arraybuffer';
            ws.addEventListener('close', e => this.lastClose = {code: e.code, reason: e.reason});

            const rfb = new RFB(this.screenEl.nativeElement, ws, {shared: true});
            rfb.background = '#15161b';
            rfb.scaleViewport = this.scaleToFit;
            rfb.clipViewport = !this.scaleToFit;
            rfb.dragViewport = !this.scaleToFit;
            rfb.resizeSession = false;
            rfb.showDotCursor = true;
            rfb.viewOnly = this.viewOnly;
            this.applyQuality(rfb, this.qualityKey);

            rfb.addEventListener('connect', () => this.ngZone.run(() => {
                this.state = 'connected';
                this.statusText = '';
                rfb.focus();
            }));
            rfb.addEventListener('disconnect', () => this.ngZone.run(() => this.onDisconnect()));
            rfb.addEventListener('credentialsrequired', (e: any) => this.ngZone.run(() => {
                const types: string[] = e.detail?.types || ['password'];
                this.credentials = {visible: true, needUsername: types.includes('username'), username: '', password: ''};
            }));
            rfb.addEventListener('securityfailure', (e: any) => this.securityReason = e.detail?.reason || '');
            rfb.addEventListener('desktopname', (e: any) => this.ngZone.run(() => this.desktopName = e.detail?.name || ''));
            rfb.addEventListener('capabilities', (e: any) => this.ngZone.run(() => this.powerSupported = !!e.detail?.capabilities?.power));
            rfb.addEventListener('clipboard', (e: any) => {
                const text = e.detail?.text;
                if (text && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
            });
            this.rfb = rfb;
        });
    }

    private onDisconnect(): void {
        this.rfb = null;
        this.powerSupported = false;
        this.credentials.visible = false;
        if (this.state === 'disconnected') return;
        this.fail(this.securityReason ? `Security handshake failed: ${this.securityReason}` : describeClose(this.lastClose));
    }

    private fail(text: string): void {
        this.state = 'disconnected';
        this.statusText = text;
    }

    disconnect(): void {
        this.rfb?.disconnect();
    }

    back(): void {
        this.rfb?.disconnect();
        leaveReuseTab(this.reuseTab, this.router, this.location, '/build/table/RemoteHost');
    }

    // ------------------------------------------------------------------ credentials

    submitCredentials(): void {
        if (!this.rfb) return;
        const creds: { username?: string; password: string } = {password: this.credentials.password};
        if (this.credentials.needUsername) creds.username = this.credentials.username;
        this.rfb.sendCredentials(creds);
        this.credentials = {visible: false, needUsername: false, username: '', password: ''};
    }

    cancelCredentials(): void {
        this.credentials.visible = false;
        this.rfb?.disconnect();
    }

    // ------------------------------------------------------------------ toolbar actions

    toggleMenu(menu: Menu, event: MouseEvent): void {
        event.stopPropagation();
        this.openMenu = this.openMenu === menu ? null : menu;
    }

    sendKey(name: 'Escape' | 'Tab' | 'Super_L' | 'F11' | 'Print'): void {
        this.openMenu = null;
        this.rfb?.sendKey(XK[name], null);
        this.rfb?.focus();
    }

    sendAltTab(): void {
        this.openMenu = null;
        if (!this.rfb) return;
        this.rfb.sendKey(XK.Alt_L, 'AltLeft', true);
        this.rfb.sendKey(XK.Tab, 'Tab');
        this.rfb.sendKey(XK.Alt_L, 'AltLeft', false);
        this.rfb.focus();
    }

    sendCtrlAltDel(): void {
        this.openMenu = null;
        this.rfb?.sendCtrlAltDel();
        this.rfb?.focus();
    }

    sendClipboard(): void {
        if (!this.rfb || !navigator.clipboard?.readText) {
            this.showToast('Clipboard access is not available in this browser');
            return;
        }
        navigator.clipboard.readText().then(text => {
            if (!text) {
                this.showToast('Local clipboard is empty');
                return;
            }
            this.rfb?.clipboardPasteFrom(text);
            this.showToast('Clipboard sent to remote');
        }).catch(() => this.showToast('Clipboard permission denied'));
    }

    screenshot(): void {
        const canvas = this.screenEl.nativeElement.querySelector('canvas');
        if (!canvas) return;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${this.hostName || 'remote'}-${stamp}.png`;
        link.click();
        this.showToast('Screenshot saved');
    }

    setQuality(key: string): void {
        this.openMenu = null;
        this.qualityKey = key;
        if (this.rfb) this.applyQuality(this.rfb, key);
    }

    private applyQuality(rfb: RFB, key: string): void {
        const preset = QUALITY_PRESETS.find(p => p.key === key) || QUALITY_PRESETS[1];
        rfb.qualityLevel = preset.quality;
        rfb.compressionLevel = preset.compression;
    }

    power(action: 'shutdown' | 'reboot' | 'reset'): void {
        this.openMenu = null;
        if (!this.rfb || !this.powerSupported) return;
        if (!window.confirm(`Send ${action} to ${this.hostName}?`)) return;
        if (action === 'shutdown') this.rfb.machineShutdown();
        else if (action === 'reboot') this.rfb.machineReboot();
        else this.rfb.machineReset();
    }

    toggleViewOnly(): void {
        this.viewOnly = !this.viewOnly;
        if (this.rfb) this.rfb.viewOnly = this.viewOnly;
    }

    toggleScale(): void {
        this.scaleToFit = !this.scaleToFit;
        if (this.rfb) {
            this.rfb.scaleViewport = this.scaleToFit;
            this.rfb.clipViewport = !this.scaleToFit;
            this.rfb.dragViewport = !this.scaleToFit;
        }
    }

    toggleFullscreen(): void {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            this.shellEl.nativeElement.requestFullscreen().catch(() => {});
        }
    }

    private showToast(text: string): void {
        this.toast = text;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.ngZone.run(() => this.toast = ''), 2000);
    }

    ngOnDestroy(): void {
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('paste', this.onPaste);
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.state = 'disconnected';
        this.rfb?.disconnect();
        this.rfb = null;
    }
}
