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
import {HttpEventType} from '@angular/common/http';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {Status} from '../../../erupt/model/erupt-api.model';
import {RemoteApiService} from '../../service/remote-api.service';
import {
    ConnState, describeClose, formatSize, joinPath, parentPath, remoteWsUrl, SftpEntry, UploadItem
} from '../../model/remote.model';

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
    @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

    @Input() hostId!: string;
    @Input() hostName = '';
    /** Ticket already issued by the entry component; used for the first connection only */
    @Input() initialTicket: string | null = null;
    /** Whether the host offers the SFTP file panel */
    @Input() fileTransfer = false;

    state: ConnState = 'connecting';
    statusText = '';
    fullscreen = false;
    toast = '';

    // ---- file panel
    filesOpen = false;
    cwd = '';
    pathInput = '';
    entries: SftpEntry[] = [];
    filesLoading = false;
    filesError = '';
    dragOver = false;
    /** Entry awaiting inline delete confirmation, by name */
    confirmDelete: string | null = null;
    newFolder: string | null = null;
    uploads: UploadItem[] = [];
    readonly formatSize = formatSize;

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
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private reuseTab: ReuseTabService
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
        leaveReuseTab(this.reuseTab, this.router, this.location, '/build/table/RemoteHost');
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

    // ------------------------------------------------------------------ file panel (SFTP)

    toggleFiles(): void {
        this.filesOpen = !this.filesOpen;
        requestAnimationFrame(() => this.fit.fit());
        if (this.filesOpen && !this.cwd) this.goHome();
    }

    goHome(): void {
        this.filesLoading = true;
        this.filesError = '';
        this.api.sftpHome(this.hostId).subscribe({
            next: res => {
                if (res.status !== Status.SUCCESS) {
                    this.filesFail(res.message);
                    return;
                }
                this.cd(res.data || '/');
            },
            error: () => this.filesFail('')
        });
    }

    cd(path: string): void {
        this.filesLoading = true;
        this.filesError = '';
        this.confirmDelete = null;
        this.newFolder = null;
        this.api.sftpList(this.hostId, path).subscribe({
            next: res => {
                this.filesLoading = false;
                if (res.status !== Status.SUCCESS) {
                    this.filesFail(res.message);
                    return;
                }
                this.cwd = path;
                this.pathInput = path;
                this.entries = res.data || [];
            },
            error: () => this.filesFail('')
        });
    }

    up(): void {
        this.cd(parentPath(this.cwd));
    }

    refresh(): void {
        this.cd(this.cwd);
    }

    goPath(): void {
        const p = this.pathInput.trim();
        if (p) this.cd(p.startsWith('/') ? p : joinPath(this.cwd, p));
    }

    openEntry(entry: SftpEntry): void {
        if (entry.directory) {
            this.cd(joinPath(this.cwd, entry.name));
        } else {
            this.download(entry);
        }
    }

    download(entry: SftpEntry): void {
        const a = document.createElement('a');
        a.href = this.api.sftpDownloadUrl(this.hostId, joinPath(this.cwd, entry.name));
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    /** Types the entry's path into the terminal at the cursor, quoted when it needs to be */
    insertPath(entry: SftpEntry): void {
        const path = joinPath(this.cwd, entry.name);
        this.send({type: 'input', data: /[^\w./@:+=-]/.test(path) ? `'${path.replace(/'/g, `'\\''`)}'` : path});
        this.term.focus();
    }

    askDelete(entry: SftpEntry): void {
        this.confirmDelete = entry.name;
    }

    doDelete(entry: SftpEntry): void {
        this.confirmDelete = null;
        this.api.sftpDelete(this.hostId, joinPath(this.cwd, entry.name)).subscribe({
            next: res => res.status === Status.SUCCESS ? this.refresh() : this.showToast(res.message || 'Delete failed'),
            error: () => this.showToast('Delete failed')
        });
    }

    createFolder(): void {
        const name = (this.newFolder || '').trim();
        this.newFolder = null;
        if (!name) return;
        this.api.sftpMkdir(this.hostId, this.cwd, name).subscribe({
            next: res => res.status === Status.SUCCESS ? this.refresh() : this.showToast(res.message || 'Create folder failed'),
            error: () => this.showToast('Create folder failed')
        });
    }

    pickFiles(): void {
        this.fileInput?.nativeElement.click();
    }

    onFilesChosen(ev: Event): void {
        const input = ev.target as HTMLInputElement;
        if (input.files) this.uploadFiles(Array.from(input.files));
        input.value = '';
    }

    onDrop(ev: DragEvent): void {
        ev.preventDefault();
        this.dragOver = false;
        if (ev.dataTransfer?.files?.length) this.uploadFiles(Array.from(ev.dataTransfer.files));
    }

    onDragOver(ev: DragEvent): void {
        ev.preventDefault();
        this.dragOver = true;
    }

    private uploadFiles(files: File[]): void {
        const dir = this.cwd;
        for (const file of files) {
            const item: UploadItem = {name: file.name, percent: 0};
            this.uploads = [...this.uploads.filter(u => u.name !== file.name || !u.done), item];
            this.api.sftpUpload(this.hostId, dir, file).subscribe({
                next: ev => {
                    if (ev.type === HttpEventType.UploadProgress && ev.total) {
                        item.percent = Math.round(ev.loaded * 100 / ev.total);
                    } else if (ev.type === HttpEventType.Response) {
                        const body = ev.body;
                        if (body && body.status !== Status.SUCCESS) {
                            item.error = body.message || 'Upload failed';
                        } else {
                            item.percent = 100;
                            item.done = true;
                            if (this.cwd === dir) this.refresh();
                            setTimeout(() => this.ngZone.run(() => this.uploads = this.uploads.filter(u => u !== item)), 2500);
                        }
                    }
                },
                error: err => item.error = err?.error?.message || err?.message || 'Upload failed'
            });
        }
    }

    dismissUpload(item: UploadItem): void {
        this.uploads = this.uploads.filter(u => u !== item);
    }

    private filesFail(message: string): void {
        this.filesLoading = false;
        this.filesError = message || 'Could not reach the file system';
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
