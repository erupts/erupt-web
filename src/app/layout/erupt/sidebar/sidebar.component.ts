import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {MenuService, SettingsService} from "@delon/theme";
import {skip, Subject, takeUntil} from "rxjs";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from "@core";
import {LayoutEruptComponent} from "../erupt.component";
import {MenuComponent, Nav} from "../menu/menu.component";
import {MenuMode, menuModeOf} from "@shared/model/erupt-menu";
import {RecentMenu, RecentMenus} from "@shared/util/recent-menu.util";

const SIDEBAR_WIDTH_KEY = 'erupt_sidebar_width';
const DEFAULT_WIDTH = 200;
const MIN_WIDTH = 150;
const MAX_WIDTH = 400;

@Component({
    standalone: false,
    selector: "layout-sidebar",
    templateUrl: "./sidebar.component.html",
    styleUrls: ["./sidebar.component.less"]
})
export class SidebarComponent implements OnInit, OnDestroy {

    resizing = false;
    loading = true;
    refreshing = false;

    private sidebarWidth = DEFAULT_WIDTH;
    private destroy$ = new Subject<void>();

    constructor(public settings: SettingsService,
                private menuSrv: MenuService,
                private layout: LayoutEruptComponent,
                private message: NzMessageService,
                private i18n: I18NService,
                private router: Router,
                private el: ElementRef<HTMLElement>) {
    }

    ngOnInit(): void {
        const saved = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
        if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
            this.sidebarWidth = saved;
        }
        this.applyWidth(this.sidebarWidth);
        this.menuSrv.change.pipe(
            skip(1),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            setTimeout(() => this.loading = false);
        });
    }

    toggleCollapsedSidebar() {
        this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
    }

    // Reload the menu from the database (flush the backend cache) to avoid serving stale menu data
    refreshMenu() {
        if (this.refreshing) {
            return;
        }
        this.refreshing = true;
        this.loading = true;
        this.layout.loadMenu(true).subscribe({
            next: () => {
                this.refreshing = false;
                this.message.success(this.i18n.fanyi("global.menu.refresh_success"));
            },
            error: () => {
                this.refreshing = false;
                this.loading = false;
            }
        });
    }

    // ── Keyword filter over the menu tree ──────────────────────────────
    // Toggled from the utility bar; the box sits above the scrolling menu and
    // filters in place (the header search is a jump-to overlay, this is not).
    // Backspacing to empty shows everything again but keeps the box; the
    // button, the box's close icon or Escape closes it and clears the filter.
    @ViewChild(MenuComponent) private menu: MenuComponent;

    @ViewChild('filterInput') private filterInput: ElementRef<HTMLInputElement>;

    filterOpen = false;

    filterKeyword = '';

    toggleFilter() {
        if (this.filterOpen) {
            this.closeFilter();
            return;
        }
        this.filterOpen = true;
        setTimeout(() => this.filterInput?.nativeElement.focus());
    }

    onFilterChange(value: string) {
        this.filterKeyword = value;
        this.menu?.setFilter(value);
    }

    closeFilter() {
        this.filterOpen = false;
        if (this.filterKeyword) {
            this.filterKeyword = '';
            this.menu?.setFilter('');
        }
    }

    // Recently visited menus (the list the layout appends to on every navigation
    // and the welcome page shows as "recently opened"). Read when the dropdown
    // opens, and limited to menus the account can still reach; a menu that was
    // renamed shows its current name.
    recent: RecentMenu[] = [];

    onRecentVisible(visible: boolean) {
        if (!visible) {
            return;
        }
        this.recent = RecentMenus.list()
            .map(r => {
                const hit = this.menuSrv.find({url: r.link, recursive: true});
                return hit ? {...r, text: hit.text || r.text} : null;
            })
            .filter((r): r is RecentMenu => !!r);
    }

    openRecent(item: RecentMenu) {
        this.router.navigateByUrl(item.link);
    }

    clearRecent() {
        RecentMenus.clear();
        this.recent = [];
    }

    // Expand or collapse all menu groups at once
    // Bring the menu item of the current page back into view: re-open its trail
    // (the user may have folded it), select its category in the split / dual
    // modes, then scroll to it and flash it once. Pages without a menu item (a
    // detail route, a link opened from a table) have nothing to locate.
    locateCurrent() {
        const path = this.menuSrv.getPathByUrl(this.router.url, true) as Nav[];
        if (!path.length) {
            return;
        }
        const top = path[0];
        const mode = this.menuMode;
        if (mode === MenuMode.SPLIT || mode === MenuMode.DUAL || mode === MenuMode.TOP_SPLIT) {
            const key = top.key || top.text;
            if (this.settings.layout['splitMenuKey'] !== key) {
                this.settings.setLayout('splitMenuKey', key);
            }
        }
        this.menuSrv.open(path[path.length - 1]);
        // after the menu re-renders the trail
        setTimeout(() => {
            const host = this.el.nativeElement;
            const target = host.querySelector<HTMLElement>('.sidebar-nav__selected > .sidebar-nav__item-link[href]')
                || host.querySelector<HTMLElement>('.sidebar-nav__selected > .sidebar-nav__item-link')
                || host.querySelector<HTMLElement>('.dual-menu__rail-item--active');
            if (!target) {
                return;
            }
            target.scrollIntoView({block: 'center', behavior: 'smooth'});
            target.classList.remove('sidebar-nav__item-link--located');
            // restart the one-shot pulse even when it is still running
            void target.offsetWidth;
            target.classList.add('sidebar-nav__item-link--located');
        });
    }

    // Active menu layout mode (see MenuMode); it is chosen in the settings drawer,
    // the sidebar only reads it (locateCurrent picks the category to select).
    get menuMode(): MenuMode {
        return menuModeOf(this.settings.layout);
    }

    onResizeStart(e: MouseEvent) {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = this.sidebarWidth;
        this.resizing = true;

        const onMove = (ev: MouseEvent) => {
            const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX));
            this.sidebarWidth = width;
            this.applyWidth(width);
        };

        const onUp = () => {
            this.resizing = false;
            localStorage.setItem(SIDEBAR_WIDTH_KEY, String(this.sidebarWidth));
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    // --sidebar-width drives the aside width, content margin and tab-bar offset;
    // in dual-column mode the first-level rail is carved out of the same width
    private applyWidth(width: number) {
        document.documentElement.style.setProperty('--sidebar-width', width + 'px');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}
