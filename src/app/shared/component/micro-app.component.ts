import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild
} from '@angular/core';

@Component({
    standalone: false,
    selector: 'erupt-micro-app',
    template: `
        <!-- The notice comes first: the container below is full height, so an alert placed
             after it would sit past the fold and only show up after scrolling. -->
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%">
            @if (reason) {
                <nz-alert [nzType]="fatal ? 'error' : 'warning'" nzShowIcon
                          style="display: block; margin: 8px; flex: none"
                          [nzMessage]="reason | translate"
                          [nzDescription]="detailTpl"></nz-alert>
                <ng-template #detailTpl>
                    <div style="word-break: break-all">{{ url }}</div>
                    @if (raw) {
                        <div style="margin-top: 4px; opacity: .65">{{ raw }}</div>
                    }
                </ng-template>
            }
            <nz-spin [nzSpinning]="loading" style="flex: 1; min-height: 0; width: 100%">
                <div #container style="width: 100%; height: 100%" [ngStyle]="style"></div>
            </nz-spin>
        </div>
    `,
    styleUrls: ['./micro-app.component.less'],
})
export class EruptMicroAppComponent implements OnInit, OnChanges, OnDestroy {

    @Input() url: string | null;

    @Input() height: string | null;

    /**
     * Container attribute overrides, e.g. {iframe: false, 'keep-alive': false}.
     * Anything micro-app accepts on the <micro-app> element can be set here.
     */
    @Input() options: { [key: string]: any } = {};

    loading: boolean = true;

    /** i18n key of the failure reason; null while things are fine. */
    reason: string | null = null;

    /** micro-app's own message, shown under the reason when there is one. */
    raw: string | null = null;

    fatal: boolean = true;

    style: { [key: string]: string } = {};

    @ViewChild('container', {static: true}) private container: ElementRef<HTMLElement>;

    // The library is 114 KB and only a handful of menus ever need it, so it is
    // fetched on first use rather than bundled into the eager chunk.
    private static starting: Promise<void>;

    private el: HTMLElement | null = null;

    private destroyed: boolean = false;

    /** Watches for a mount that reports success but paints nothing. */
    private observer: MutationObserver | null = null;

    private emptyTimer: any;

    /** How long a mounted sub app may stay blank before it is called out. */
    private static readonly BLANK_GRACE_MS = 3000;

    constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {
    }

    ngOnInit() {
        if (this.height) {
            this.style['height'] = this.height;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['url'] && this.url) {
            this.mount();
        }
    }

    /**
     * micro-app reads every option off the element when it connects, so the element is
     * built and fully configured before it is put in the DOM. Creating it in the template
     * instead would connect it bare and leave the mount depending on attribute-change
     * timing, which is how this silently rendered nothing before.
     */
    private mount() {
        this.teardown();
        this.loading = true;
        this.reason = null;
        this.raw = null;
        this.start().then(() => {
            if (this.destroyed || !this.url) {
                return;
            }
            const el = document.createElement('micro-app');
            const attrs: { [key: string]: any } = {
                name: this.appName(),
                url: this.url,
                // iframe sandbox: the sub app gets a real JS global instead of a `with`
                // proxy. ES module builds (Vite) only work here — micro-app cannot wrap a
                // module script in `with`, so under the default sandbox such a sub app
                // either fails outright or escapes the proxy entirely.
                iframe: '',
                // Survive a tab switch: reuse-tab destroys this component, and without
                // keep-alive the sub app reloads from scratch every time.
                'keep-alive': '',
                'router-mode': 'native',
                ...this.options
            };
            for (const key of Object.keys(attrs)) {
                const value = attrs[key];
                if (value === false || value === null || value === undefined) {
                    continue;
                }
                el.setAttribute(key, value === true ? '' : String(value));
            }
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.display = 'block';
            // These fire outside Angular's zone.
            el.addEventListener('mounted', () => this.onMounted(el));
            el.addEventListener('aftershow', () => this.onMounted(el));
            // micro-app puts its own message on detail.error; the element's plain `error`
            // event carries nothing, so this is the only place the real cause surfaces.
            el.addEventListener('error', (e: any) => this.fail(e?.detail?.error?.message));
            this.el = el;
            this.container.nativeElement.appendChild(el);
        }).catch(error => {
            console.error('Failed to load micro-app:', error);
            this.fail(error?.message);
        });
    }

    private onMounted(el: HTMLElement) {
        this.zone.run(() => {
            this.loading = false;
            this.reason = null;
            this.cdr.markForCheck();
        });
        this.watchBlank(el);
    }

    /**
     * A sub app can mount cleanly and still paint nothing — SSR streaming frameworks do
     * exactly that, because their hydration bootstrap cannot survive being extracted from
     * the document. Nothing is logged in that case, so the blank page is detected here.
     */
    private watchBlank(el: HTMLElement) {
        this.stopWatching();
        const rendered = () => {
            const body = el.querySelector('micro-app-body');
            return !!body && (body.childElementCount > 0 || (body.textContent || '').trim().length > 0);
        };
        this.emptyTimer = setTimeout(() => {
            if (!this.destroyed && !rendered()) {
                this.fail(null, 'micro_app.err_no_render', false);
            }
        }, EruptMicroAppComponent.BLANK_GRACE_MS);
        // A late render clears the warning instead of leaving a wrong message on screen.
        this.observer = new MutationObserver(() => {
            if (rendered()) {
                this.stopWatching();
                if (this.reason === 'micro_app.err_no_render') {
                    this.zone.run(() => {
                        this.reason = null;
                        this.cdr.markForCheck();
                    });
                }
            }
        });
        this.observer.observe(el, {childList: true, subtree: true, characterData: true});
    }

    /**
     * Shows why the embed failed. micro-app cannot tell a CORS rejection from a 404 or
     * from a server that answers 200 with an error page, so the url is re-fetched here to
     * name the cause instead of showing one generic message for every failure.
     */
    private fail(raw?: string | null, known?: string, fatal: boolean = true) {
        this.stopWatching();
        this.zone.run(() => {
            this.loading = false;
            this.fatal = fatal;
            this.raw = raw || null;
            this.reason = known || 'micro_app.err_unknown';
            this.cdr.markForCheck();
        });
        if (known || !this.url) {
            return;
        }
        this.diagnose(this.url).then(key => {
            if (this.destroyed) {
                return;
            }
            this.zone.run(() => {
                this.reason = key;
                this.cdr.markForCheck();
            });
        });
    }

    private diagnose(url: string): Promise<string> {
        return fetch(url, {cache: 'no-cache'}).then(res => {
            if (!res.ok) {
                this.raw = 'HTTP ' + res.status;
                return 'micro_app.err_http';
            }
            return res.text().then(text => {
                // erupt's template engine answers 200 with this body when the file is not
                // on the classpath, which is the most common setup mistake by far.
                if (text.length < 200 && /404\s*not\s*found/i.test(text)) {
                    return 'micro_app.err_tpl_missing';
                }
                if (!/<head[\s>]/i.test(text)) {
                    return 'micro_app.err_not_html';
                }
                return 'micro_app.err_unknown';
            });
        }).catch(() => 'micro_app.err_cors');
    }

    /** Loads and starts the library once per page; later instances reuse the same promise. */
    private start(): Promise<void> {
        if (!EruptMicroAppComponent.starting) {
            EruptMicroAppComponent.starting = import('@micro-zoe/micro-app')
                .then(m => m.default.start({'router-mode': 'native'}));
        }
        return EruptMicroAppComponent.starting;
    }

    /**
     * Stable per sub app, distinct between sub apps. A fixed name made two micro-frontend
     * menus collide under reuse-tab; deriving it from the url also lets keep-alive resume
     * the same instance when the menu is reopened. The query string is dropped because it
     * carries the token, which must not end up in a DOM attribute used as an identifier.
     */
    private appName(): string {
        const key = (this.url || '').split('?')[0];
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (Math.imul(hash, 31) + key.charCodeAt(i)) | 0;
        }
        return 'erupt-micro-' + Math.abs(hash).toString(36);
    }

    private stopWatching() {
        clearTimeout(this.emptyTimer);
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    private teardown() {
        this.stopWatching();
        if (this.el) {
            this.el.remove();
            this.el = null;
        }
    }

    ngOnDestroy() {
        this.destroyed = true;
        this.teardown();
    }

}
