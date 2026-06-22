import {Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';

interface TermTab {
    id: number;
    term: Terminal;
    fit: FitAddon;
    ws: WebSocket | null;
    retryCount: number;
    retryDelay: number;
    retryTimer: ReturnType<typeof setTimeout> | null;
    hasActivity: boolean;
}

const TERM_THEME = {
    background: '#1b2027',
    foreground: '#abb2bf',
    cursor: '#528bff',
    cursorAccent: '#1b2027',
    selectionBackground: 'rgba(82,139,255,0.25)',
    black: '#1b2027',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff'
};

@Component({
    standalone: false,
    selector: 'app-terminal',
    templateUrl: './terminal.component.html',
    styleUrls: ['./terminal.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class TerminalComponent implements OnInit, OnDestroy {

    @ViewChild('terminalsEl', {static: true}) terminalsEl!: ElementRef<HTMLDivElement>;

    tabs: TermTab[] = [];
    activeId: number | null = null;
    private tabSeq = 0;
    private resizeObserver!: ResizeObserver;
    private wsUrl: string;

    constructor(
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private ngZone: NgZone
    ) {
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        const token = encodeURIComponent(this.tokenService.get()?.token || '');
        this.wsUrl = `${protocol}://${location.host}/erupt-terminal?token=${token}`;
    }

    ngOnInit(): void {
        this.createTab();
        this.ngZone.runOutsideAngular(() => {
            this.resizeObserver = new ResizeObserver(() => {
                const active = this.tabs.find(t => t.id === this.activeId);
                active?.fit.fit();
            });
            this.resizeObserver.observe(this.terminalsEl.nativeElement);
        });
    }

    createTab(): void {
        this.tabSeq++;
        const id = this.tabSeq;

        this.tabs.forEach(t => {
            const wrap = document.getElementById(`wrap-${t.id}`);
            if (wrap) wrap.classList.remove('active');
        });
        this.activeId = id;

        const wrap = document.createElement('div');
        wrap.className = 'term-wrap active';
        wrap.id = `wrap-${id}`;
        this.terminalsEl.nativeElement.appendChild(wrap);

        const term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'bar',
            fontSize: 14,
            fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",Menlo,Monaco,"Courier New",monospace',
            lineHeight: 1.25,
            theme: TERM_THEME
        });

        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(wrap);

        const tab: TermTab = {id, term, fit, ws: null, retryCount: 0, retryDelay: 1000, retryTimer: null, hasActivity: false};
        this.tabs.push(tab);

        term.onData(data => this.tabSend(tab, {type: 'input', data}));
        term.onResize(sz => this.tabSend(tab, {type: 'resize', cols: sz.cols, rows: sz.rows}));

        requestAnimationFrame(() => {
            fit.fit();
            this.connectTab(tab);
        });
    }

    private connectTab(tab: TermTab): void {
        this.ngZone.runOutsideAngular(() => {
            const ws = new WebSocket(this.wsUrl);
            tab.ws = ws;

            ws.onopen = () => {
                if (tab.retryTimer) {
                    tab.term.writeln('\r\n\x1b[32m── reconnected ──\x1b[0m\r\n');
                    tab.retryTimer = null;
                }
                tab.retryCount = 0;
                tab.retryDelay = 1000;
                this.tabSend(tab, {type: 'resize', cols: tab.term.cols, rows: tab.term.rows});
            };

            ws.onmessage = e => {
                tab.term.write(e.data);
                if (tab.id !== this.activeId) {
                    this.ngZone.run(() => tab.hasActivity = true);
                }
            };

            ws.onclose = event => {
                if (event.code === 1000) {
                    tab.term.writeln('\r\n\x1b[38;5;240m── session ended ──\x1b[0m');
                } else if (event.code === 4000) {
                    tab.term.writeln('\r\n\x1b[38;5;240m── idle timeout ──\x1b[0m');
                } else if (tab.retryCount < 8) {
                    tab.retryCount++;
                    const sec = tab.retryDelay / 1000;
                    tab.term.writeln(`\r\n\x1b[33m── reconnecting in ${sec}s (${tab.retryCount}/8) ──\x1b[0m`);
                    tab.retryTimer = setTimeout(() => this.connectTab(tab), tab.retryDelay);
                    tab.retryDelay = Math.min(tab.retryDelay * 2, 30000);
                } else {
                    tab.term.writeln('\r\n\x1b[31m── connection lost ──\x1b[0m');
                }
            };

            ws.onerror = () => {};
        });
    }

    private tabSend(tab: TermTab, msg: object): void {
        if (tab.ws?.readyState === WebSocket.OPEN) {
            tab.ws.send(JSON.stringify(msg));
        }
    }

    switchTab(id: number): void {
        this.activeId = id;
        this.tabs.forEach(t => {
            const wrap = document.getElementById(`wrap-${t.id}`);
            if (t.id === id) {
                wrap?.classList.add('active');
                t.hasActivity = false;
                requestAnimationFrame(() => t.fit.fit());
            } else {
                wrap?.classList.remove('active');
            }
        });
    }

    closeTab(id: number, event: MouseEvent): void {
        event.stopPropagation();
        if (this.tabs.length === 1) return;
        const tab = this.tabs.find(t => t.id === id);
        if (!tab) return;
        if (tab.retryTimer) clearTimeout(tab.retryTimer);
        tab.ws?.close(1000, 'tab closed');
        tab.term.dispose();
        document.getElementById(`wrap-${id}`)?.remove();
        this.tabs = this.tabs.filter(t => t.id !== id);
        if (this.activeId === id) this.switchTab(this.tabs[this.tabs.length - 1].id);
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.altKey && event.key === 't') {
            event.preventDefault();
            this.createTab();
        }
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.tabs.forEach(t => {
            if (t.retryTimer) clearTimeout(t.retryTimer);
            t.ws?.close(1000, 'component destroyed');
            t.term.dispose();
        });
    }
}
