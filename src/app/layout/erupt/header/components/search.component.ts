import {AfterViewInit, Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {MenuService} from "@delon/theme";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {NzModalRef} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {MenuTypeEnum, MenuVo} from "@shared/model/erupt-menu";
import {generateMenuPath} from "@shared/util/erupt.util";
import {RecentMenus} from "@shared/util/recent-menu.util";
import {MenuComponent} from "../../menu/menu.component";
import {COMMAND_PREFIX, PALETTE_GROUP_TITLE, PaletteCommand, PaletteGroup, PaletteItem, SearchHistory} from "./search.model";

// rows per group, so one group never pushes the others out of sight
const GROUP_LIMIT = 8;
const MENU_LIMIT = 20;

@Component({
    standalone: false,
    selector: 'header-search',
    template: `
        <div class="hs" (keydown)="onKeydown($event)">
            <label class="hs__search">
                <i nz-icon nzType="search" class="hs__search-icon"></i>
                <input #input class="hs__search-input" [ngModel]="text" (ngModelChange)="onQuery($event)"
                       [placeholder]="'global.search.hint' | translate" autocomplete="off" spellcheck="false">
            </label>
            <div class="hs__body" #list>
                <!-- past queries as tags, mouse only: ↑ ↓ stays on the result rows -->
                @if (!text && history.length) {
                    <div class="hs__group">
                        <span>{{ 'search.group.history' | translate }}</span>
                        <a class="hs__clear" (click)="clearHistory()">{{ 'menu.recent_clear' | translate }}</a>
                    </div>
                    <div class="hs__tags">
                        @for (q of history; track q) {
                            <nz-tag nzMode="closeable" [title]="q" (click)="useHistory($event, q)"
                                    (nzOnClose)="removeHistory(q)">{{ q }}</nz-tag>
                        }
                    </div>
                }
                @for (it of items; track $index; let i = $index) {
                    @if (i === 0 || items[i - 1].group !== it.group) {
                        <div class="hs__group">{{ groupTitle(it.group) | translate }}</div>
                    }
                    <div class="hs__item" [class.hs__item--active]="i === active"
                         (mouseenter)="active = i" (click)="pick(it)">
                        <span class="hs__icon">
                            @if (it.iconClass) {
                                <i class="{{ it.iconClass }}"></i>
                            } @else {
                                <i nz-icon [nzType]="it.icon || 'unordered-list'"></i>
                            }
                        </span>
                        <span class="hs__label">{{ it.label }}</span>
                        <span class="hs__hint">{{ it.hint }}</span>
                        <i nz-icon nzType="enter" class="hs__enter"></i>
                    </div>
                } @empty {
                    @if (text || !history.length) {
                        <div class="hs__empty">{{ 'search.empty' | translate }}</div>
                    }
                }
            </div>
            <div class="hs__foot">
                <span><kbd>↑</kbd><kbd>↓</kbd>{{ 'search.foot.select' | translate }}</span>
                <span><kbd>↵</kbd>{{ 'search.foot.open' | translate }}</span>
                <span><kbd>Esc</kbd>{{ 'search.foot.close' | translate }}</span>
                <span class="hs__foot-end"><kbd>&gt;</kbd>{{ 'search.foot.command' | translate }}</span>
            </div>
        </div>
    `,
    // One 20px gutter from the panel edge lines up the search icon, group
    // titles, tags, row icons and the footer (8px body padding + 12px inside).
    styles: [`
        .hs { --hs-text: var(--erupt-text, rgba(0, 0, 0, .88));
            --hs-muted: var(--erupt-text-tertiary, rgba(0, 0, 0, .45));
            --hs-line: var(--ant-border-color-split, rgba(5, 5, 5, .06));
            color: var(--hs-text); }

        .hs__search { display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 20px;
            margin: 0; border-bottom: 1px solid var(--hs-line); cursor: text; }
        .hs__search-icon { font-size: 18px; color: var(--hs-muted); }
        .hs__search-input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; outline: 0;
            background: transparent; color: var(--hs-text); font-size: 15px; }
        .hs__search-input::placeholder { color: var(--hs-muted); }

        .hs__body { max-height: 400px; overflow-y: auto; padding: 4px 8px 8px; }

        .hs__group { display: flex; align-items: center; justify-content: space-between; height: 32px;
            padding: 4px 12px 0; font-size: 12px; color: var(--hs-muted); }
        .hs__clear { color: inherit; }
        .hs__clear:hover { color: var(--ant-primary-color); }

        /* borderless filled tags, 4px corners, text lined up with the group titles and row icons; the × only shows on hover */
        .hs__tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 2px 4px 6px; }
        .hs__tags nz-tag { max-width: 180px; height: 24px; margin: 0; padding: 0 8px; line-height: 24px;
            overflow: hidden; text-overflow: ellipsis; border: 0; border-radius: 4px; cursor: pointer;
            background: var(--erupt-fill-secondary, rgba(0, 0, 0, .06)); color: var(--erupt-text-secondary, rgba(0, 0, 0, .65));
            transition: background-color .15s, color .15s; }
        .hs__tags nz-tag:hover { background: var(--ant-primary-1, #e6f4ff); color: var(--ant-primary-color); }
        .hs__tags nz-tag ::ng-deep .ant-tag-close-icon { width: 0; margin-left: 0; opacity: 0;
            transition: width .15s, margin .15s, opacity .15s; }
        .hs__tags nz-tag:hover ::ng-deep .ant-tag-close-icon { width: 12px; margin-left: 4px; opacity: 1; }

        .hs__item { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px;
            border-radius: 8px; cursor: pointer; }
        .hs__item--active { background: var(--ant-primary-1, #e6f4ff); }
        .hs__icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
            width: 16px; font-size: 14px; color: var(--erupt-text-secondary, rgba(0, 0, 0, .65)); }
        .hs__item--active .hs__icon { color: var(--ant-primary-color); }
        .hs__label { flex-shrink: 0; max-width: 60%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .hs__hint { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
            font-size: 12px; color: var(--hs-muted); }
        .hs__enter { flex-shrink: 0; width: 16px; color: var(--hs-muted); visibility: hidden; }
        .hs__item--active .hs__enter { visibility: visible; }

        .hs__empty { padding: 32px 0; text-align: center; color: var(--hs-muted); }

        .hs__foot { display: flex; align-items: center; gap: 16px; height: 40px; padding: 0 20px;
            font-size: 12px; color: var(--hs-muted); border-top: 1px solid var(--hs-line); }
        .hs__foot > span { display: inline-flex; align-items: center; gap: 4px; }
        .hs__foot-end { margin-left: auto; }
        .hs__foot kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 20px;
            height: 20px; padding: 0 5px; border-radius: 4px; font: 11px/1 var(--erupt-font, inherit);
            color: var(--erupt-text-secondary, rgba(0, 0, 0, .65));
            background: var(--erupt-bg-container, #fff);
            border: 1px solid var(--erupt-border, rgba(0, 0, 0, .15));
            box-shadow: 0 1px 0 var(--erupt-border, rgba(0, 0, 0, .15)); }
    `]
})
export class HeaderSearchComponent implements AfterViewInit {

    @ViewChild('input') private input: ElementRef<HTMLInputElement>;

    @ViewChild('list') private list: ElementRef<HTMLElement>;

    private menus: MenuVo[] = [];

    private menuMap = new Map<number, MenuVo>();

    set menu(value: MenuVo[]) {
        this.menus = value || [];
        this.menuMap.clear();
        this.menus.forEach(m => this.menuMap.set(m.id, m));
        this.refresh();
    }

    private _commands: PaletteCommand[] = [];

    set commands(value: PaletteCommand[]) {
        this._commands = value || [];
        this.refresh();
    }

    text = '';

    history: string[] = SearchHistory.list();

    items: PaletteItem[] = [];

    active = 0;

    constructor(private router: Router,
                private menuSrv: MenuService,
                private i18n: I18NService,
                private modalRef: NzModalRef,
                @Inject(ReuseTabService) private reuseTabSrv: ReuseTabService) {
    }

    ngAfterViewInit() {
        setTimeout(() => this.input?.nativeElement.focus());
    }

    groupTitle(group: PaletteGroup): string {
        return PALETTE_GROUP_TITLE[group];
    }

    onQuery(value: string) {
        this.text = value;
        this.refresh();
    }

    // Empty query: open tabs, recent visits, favorites. A query: matching
    // menus (by name or route), tabs and commands. ">" lists commands only.
    private refresh() {
        const raw = (this.text || '').trim();
        let items: PaletteItem[];
        if (raw.startsWith(COMMAND_PREFIX)) {
            items = this.commandItems(raw.slice(COMMAND_PREFIX.length).trim().toLowerCase());
        } else if (!raw) {
            items = [...this.tabItems(''), ...this.recentItems(), ...this.favoriteItems()];
        } else {
            const kw = raw.toLowerCase();
            items = [...this.menuItems(kw), ...this.tabItems(kw), ...this.commandItems(kw)];
        }
        this.items = items;
        this.active = 0;
    }

    // A past query refills the box instead of leaving
    useHistory(e: MouseEvent, q: string) {
        // the tag's close icon sits inside it: that click removes, it does not refill
        if ((e.target as HTMLElement).closest('.ant-tag-close-icon')) {
            return;
        }
        this.onQuery(q);
        setTimeout(() => this.input?.nativeElement.focus());
    }

    removeHistory(q: string) {
        SearchHistory.remove(q);
        this.history = SearchHistory.list();
    }

    clearHistory() {
        SearchHistory.clear();
        this.history = [];
    }

    private menuItems(kw: string): PaletteItem[] {
        return this.menus
            .filter(m => m.type !== MenuTypeEnum.button && m.type !== MenuTypeEnum.api && m.value)
            .filter(m => (m.name || '').toLowerCase().includes(kw) || String(m.value).toLowerCase().includes(kw))
            .slice(0, MENU_LIMIT)
            .map(m => ({
                group: PaletteGroup.MENU,
                label: m.name,
                hint: this.parents(m),
                iconClass: m.icon || undefined,
                run: () => this.router.navigateByUrl(generateMenuPath(m.type, m.value))
            }));
    }

    // Open tabs except the current page
    private tabItems(kw: string): PaletteItem[] {
        const current = this.router.url.split('?')[0];
        return (this.reuseTabSrv.items || [])
            .filter(t => t.url.split('?')[0] !== current)
            .map(t => ({url: t.url, title: t.title?.text || (t.title?.i18n ? this.i18n.fanyi(t.title.i18n) : t.url)}))
            .filter(t => !kw || t.title.toLowerCase().includes(kw))
            .slice(0, GROUP_LIMIT)
            .map(t => ({
                group: PaletteGroup.TAB,
                label: t.title,
                icon: 'appstore',
                run: () => this.router.navigateByUrl(t.url)
            }));
    }

    // Recent visits (except the current page) still reachable from the menu, under their current name
    private recentItems(): PaletteItem[] {
        const current = this.router.url.split('?')[0];
        return RecentMenus.list()
            .filter(r => r.link.split('?')[0] !== current)
            .map(r => ({r, hit: this.menuSrv.find({url: r.link, recursive: true})}))
            .filter(x => !!x.hit)
            .slice(0, GROUP_LIMIT)
            .map(({r, hit}) => ({
                group: PaletteGroup.RECENT,
                label: hit.text || r.text,
                icon: 'history',
                run: () => this.router.navigateByUrl(r.link)
            }));
    }

    // Favorites pinned in the sidebar (stored by link, or by text for a link-less item)
    private favoriteItems(): PaletteItem[] {
        let keys: string[] = [];
        try {
            keys = JSON.parse(localStorage.getItem(MenuComponent.FAVORITES_KEY) || '[]');
        } catch {
            keys = [];
        }
        return keys
            .map(k => this.menuSrv.find({url: k, recursive: true}))
            .filter(n => !!n?.link)
            .slice(0, GROUP_LIMIT)
            .map(n => ({
                group: PaletteGroup.FAVORITE,
                label: n.text,
                icon: 'pushpin',
                run: () => this.router.navigateByUrl(n.link)
            }));
    }

    private commandItems(kw: string): PaletteItem[] {
        return this._commands
            .filter(c => !kw || c.label.toLowerCase().includes(kw))
            .map(c => ({group: PaletteGroup.COMMAND, label: c.label, icon: c.icon, run: c.run}));
    }

    private parents(item: MenuVo): string {
        const parts: string[] = [];
        let cur = this.menuMap.get(item.pid);
        while (cur) {
            parts.unshift(cur.name);
            cur = this.menuMap.get(cur.pid);
        }
        return parts.join(' / ');
    }

    onKeydown(e: KeyboardEvent) {
        if (!this.items.length) {
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const n = this.items.length;
            this.active = (this.active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
            setTimeout(() => this.list?.nativeElement
                .querySelector('.hs__item--active')?.scrollIntoView({block: 'nearest'}));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.pick(this.items[this.active]);
        }
    }

    pick(item: PaletteItem) {
        if (!item) {
            return;
        }
        // a pick made from a typed query keeps that query for next time
        SearchHistory.push(this.text);
        this.modalRef.close();
        item.run();
    }

}
