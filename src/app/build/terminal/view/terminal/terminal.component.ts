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
    background: '#15161b',
    foreground: '#d6d6d6',
    cursor: '#c7c7c7',
    cursorAccent: '#15161b',
    selectionBackground: 'rgba(255,255,255,0.18)',
    black: '#1c1d22',
    red: '#ff6b66',
    green: '#a2c95c',
    yellow: '#d9c76a',
    blue: '#6cb2ff',
    magenta: '#d183e8',
    cyan: '#5fd1d5',
    white: '#d6d6d6',
    brightBlack: '#7a7a80',
    brightRed: '#ff8580',
    brightGreen: '#b5da74',
    brightYellow: '#e8d98a',
    brightBlue: '#8ac2ff',
    brightMagenta: '#df9df0',
    brightCyan: '#7fdde1',
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
    sideCollapsed: boolean = localStorage.getItem('erupt-terminal-side-collapsed') === '1';
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
            cursorStyle: 'block',
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

        requestAnimationFrame(() => fit.fit());
        // On a hard refresh the container is still shifting (fonts, sidebar,
        // scrollbars) right after route activation; if the PTY starts with stale
        // cols, zsh's first prompt wraps and leaves a stray "%" line. So connect
        // only once the measured size has been stable for a few ticks.
        document.fonts.ready.then(() => this.connectWhenStable(tab));
    }

    private connectWhenStable(tab: TermTab): void {
        this.ngZone.runOutsideAngular(() => {
            let lastCols = -1, lastRows = -1, stable = 0, attempts = 0;
            const timer = setInterval(() => {
                if (!this.tabs.includes(tab)) {
                    clearInterval(timer);
                    return;
                }
                const dims = tab.fit.proposeDimensions();
                if (dims && dims.cols === lastCols && dims.rows === lastRows) {
                    stable++;
                } else {
                    stable = 0;
                    lastCols = dims?.cols ?? -1;
                    lastRows = dims?.rows ?? -1;
                }
                if (stable >= 3 || ++attempts >= 40) {
                    clearInterval(timer);
                    tab.fit.fit();
                    this.connectTab(tab);
                }
            }, 50);
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

    toggleSide(): void {
        this.sideCollapsed = !this.sideCollapsed;
        localStorage.setItem('erupt-terminal-side-collapsed', this.sideCollapsed ? '1' : '0');
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
