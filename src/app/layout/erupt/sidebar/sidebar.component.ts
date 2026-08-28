import {Component, OnDestroy, OnInit} from "@angular/core";
import {MenuService, SettingsService} from "@delon/theme";
import {skip, Subject, takeUntil} from "rxjs";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {LayoutEruptComponent} from "../erupt.component";
import {MenuComponent} from "../menu/menu.component";

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
    allExpanded = false;

    private sidebarWidth = DEFAULT_WIDTH;
    private destroy$ = new Subject<void>();

    constructor(public settings: SettingsService,
                private menuSrv: MenuService,
                private layout: LayoutEruptComponent,
                private message: NzMessageService,
                private modal: NzModalService,
                private i18n: I18NService) {
    }

    get splitMenu(): boolean {
        return !!this.settings.layout['splitMenu'];
    }

    ngOnInit(): void {
        const saved = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
        if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
            this.sidebarWidth = saved;
            this.applyWidth(saved);
        }
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

    // Clear the locally persisted drag-order and favorites, then restore the server default menu
    resetMenu() {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi("menu.reset"),
            nzContent: this.i18n.fanyi("menu.reset_confirm"),
            nzOnOk: () => {
                localStorage.removeItem(MenuComponent.MENU_ORDER_KEY);
                localStorage.removeItem(MenuComponent.FAVORITES_KEY);
                this.loading = true;
                this.layout.loadMenu().subscribe({
                    next: () => this.message.success(this.i18n.fanyi("menu.reset_success")),
                    error: () => this.loading = false
                });
            }
        });
    }

    // Expand or collapse all menu groups at once
    toggleExpandAll() {
        this.allExpanded = !this.allExpanded;
        this.menuSrv.openAll(this.allExpanded);
    }

    // Switch between the normal single-column menu and the split (top-level tabs) menu
    toggleSplitMenu() {
        this.settings.setLayout("splitMenu", !this.splitMenu);
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

    private applyWidth(width: number) {
        document.documentElement.style.setProperty('--sidebar-width', width + 'px');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}
