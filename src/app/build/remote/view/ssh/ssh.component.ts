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
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {Status} from '../../../erupt/model/erupt-api.model';
import {RemoteApiService} from '../../service/remote-api.service';
import {ConnState, describeClose, remoteWsUrl} from '../../model/remote.model';

const TERM_THEME = {
    background: '#15161b', foreground: '#d6d6d6', cursor: '#c7c7c7', cursorAccent: '#15161b',
    selectionBackground: 'rgba(255,255,255,0.18)',
    black: '#1c1d22', red: '#ff6b66', green: '#a2c95c', yellow: '#d9c76a', blue: '#6cb2ff',
    magenta: '#d183e8', cyan: '#5fd1d5', white: '#d6d6d6',
    brightBlack: '#7a7a80', brightRed: '#ff8580', brightGreen: '#b5da74', brightYellow: '#e8d98a',
    brightBlue: '#8ac2ff', brightMagenta: '#df9df0', brightCyan: '#7fdde1', brightWhite: '#ffffff'
};

@Component({
    standalone: false,
    selector: 'app-remote-ssh',
    templateUrl: './ssh.component.html',
    styleUrls: ['./ssh.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class SshComponent implements OnInit, OnDestroy {

    @ViewChild('shell', {static: true}) shellEl!: ElementRef<HTMLDivElement>;
    @ViewChild('termEl', {static: true}) termEl!: ElementRef<HTMLDivElement>;

    @Input() hostId!: string;
    @Input() hostName = '';
    /** Ticket already issued by the entry component; used for the first connection only */
    @Input() initialTicket: string | null = null;

    state: ConnState = 'connecting';
    statusText = '';
    fullscreen = false;
    toast = '';

    private term!: Terminal;
    private fit!: FitAddon;
    private ws: WebSocket | null = null;
    private resizeObserver!: ResizeObserver;
    private toastTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly onFullscreenChange = () => this.ngZone.run(() => {
        this.fullscreen = !!document.fullscreenElement;
        requestAnimationFrame(() => this.fit.fit());
    });

    constructor(
        private router: Router,
        private location: Location,
        private api: RemoteApiService,
        private ngZone: NgZone,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
    }

    ngOnInit(): void {
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
        this.term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 14,
            fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",Menlo,Monaco,"Courier New",monospace',
            lineHeight: 1.25,
            theme: TERM_THEME
        });
        this.fit = new FitAddon();
        this.term.loadAddon(this.fit);
        this.term.open(this.termEl.nativeElement);
        this.term.onData(data => this.send({type: 'input', data}));
        this.term.onResize(sz => this.send({type: 'resize', cols: sz.cols, rows: sz.rows}));
        this.ngZone.runOutsideAngular(() => {
            this.resizeObserver = new ResizeObserver(() => this.fit.fit());
            this.resizeObserver.observe(this.termEl.nativeElement);
        });
        requestAnimationFrame(() => this.fit.fit());
        document.fonts.ready.then(() => {
            this.fit.fit();
            this.connect();
        });
    }

    // ------------------------------------------------------------------ connection

    connect(): void {
        this.state = 'connecting';
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
            const ws = new WebSocket(url);
            this.ws = ws;
            ws.onopen = () => {
                this.ngZone.run(() => {
                    this.state = 'connected';
                    this.statusText = '';
                });
                this.send({type: 'resize', cols: this.term.cols, rows: this.term.rows});
                this.term.focus();
            };
            ws.onmessage = e => this.term.write(e.data);
            ws.onclose = e => this.ngZone.run(() => {
                if (this.ws !== ws) return;
                this.ws = null;
                const text = describeClose({code: e.code, reason: e.reason}, e.code === 1000 ? 'Session ended' : 'Connection lost');
                this.term.writeln(`\r\n\x1b[38;5;240m── ${text} ──\x1b[0m`);
                this.fail(text);
            });
            ws.onerror = () => {};
        });
    }

    private send(msg: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
    }

    private fail(text: string): void {
        this.state = 'disconnected';
        this.statusText = text;
    }

    disconnect(): void {
        this.ws?.close(1000, 'closed by user');
    }

    back(): void {
        this.ws?.close(1000, 'closed by user');
        if (window.history.length > 1) this.location.back();
        else this.router.navigate(['/build/table/RemoteHost']);
    }

    // ------------------------------------------------------------------ toolbar actions

    pasteClipboard(): void {
        if (!navigator.clipboard?.readText) {
            this.showToast('Clipboard access is not available in this browser');
            return;
        }
        navigator.clipboard.readText().then(text => {
            if (!text) {
                this.showToast('Local clipboard is empty');
                return;
            }
            this.send({type: 'input', data: text});
            this.term.focus();
        }).catch(() => this.showToast('Clipboard permission denied'));
    }

    sendCtrlC(): void {
        this.send({type: 'input', data: '\x03'});
        this.term.focus();
    }

    clear(): void {
        this.term.clear();
        this.term.focus();
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
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.resizeObserver?.disconnect();
        const ws = this.ws;
        this.ws = null;
        ws?.close(1000, 'component destroyed');
        this.term.dispose();
    }
}
