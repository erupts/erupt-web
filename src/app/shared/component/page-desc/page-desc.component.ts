import {Component, HostBinding, Input} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

// Where a page-desc instance renders: the strip above the page toolbar, or the
// small info button inside the toolbar that remains once the strip is folded.
export enum PageDescMode {
    STRIP = 'strip',
    ICON = 'icon',
}

const STORAGE_KEY = 'erupt_page_desc_collapsed';

/**
 * Page description (`@Erupt(desc)`, BI remark …) shown WITH the page it
 * describes instead of in the global header.
 *
 * Two instances share one state per `key`: the STRIP instance sits above the
 * toolbar and is visible while expanded; the ICON instance sits inside the
 * toolbar and is visible while collapsed (hover shows the text in a popover,
 * click expands the strip again). The collapsed choice is remembered per key
 * in localStorage, so a user who folded a page's description stays folded.
 */
@Component({
    standalone: false,
    selector: 'erupt-page-desc',
    templateUrl: './page-desc.component.html',
    styleUrls: ['./page-desc.component.less']
})
export class PageDescComponent {

    // one subject per key, shared by every instance rendered for that page
    private static readonly states = new Map<string, BehaviorSubject<boolean>>();

    readonly PageDescMode = PageDescMode;

    @Input() desc: string | null = null;

    @Input() mode: PageDescMode = PageDescMode.STRIP;

    @HostBinding('class.page-desc-host--icon')
    get isIcon(): boolean {
        return this.mode === PageDescMode.ICON;
    }

    private state: BehaviorSubject<boolean> | null = null;

    private _key = '';

    @Input()
    set key(value: string | null | undefined) {
        this._key = value || '';
        this.state = PageDescComponent.stateFor(this._key);
    }

    get collapsed(): boolean {
        return this.state?.value ?? false;
    }

    setCollapsed(value: boolean): void {
        if (!this.state) return;
        this.state.next(value);
        PageDescComponent.persist(this._key, value);
    }

    private static stateFor(key: string): BehaviorSubject<boolean> {
        let s = PageDescComponent.states.get(key);
        if (!s) {
            s = new BehaviorSubject<boolean>(PageDescComponent.load()[key] === true);
            PageDescComponent.states.set(key, s);
        }
        return s;
    }

    private static load(): Record<string, boolean> {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
        } catch {
            return {};
        }
    }

    private static persist(key: string, collapsed: boolean): void {
        if (!key) return;
        const all = PageDescComponent.load();
        if (collapsed) {
            all[key] = true;
        } else {
            delete all[key];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
}
