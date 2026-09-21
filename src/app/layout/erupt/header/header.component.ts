import {openResizableDrawer} from "@shared/component/resizable-drawer.component";
import {AfterViewInit, Component, Inject, Input, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {Menu, MenuInner, MenuService, SettingsService} from "@delon/theme";
import {Subject, takeUntil} from "rxjs";
import screenfull from 'screenfull';
import {CustomerTool, WindowModel} from "@shared/model/window.model";
import {Router} from "@angular/router";
import {NzModalService} from "ng-zorro-antd/modal";
import {HeaderSearchComponent} from "./components/search.component";
import {MenuVo, selectedTopMenu, topLevelMenus} from "@shared/model/erupt-menu";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {EruptTenantInfoData} from "../../../build/erupt/model/erupt-tenant";
import {DataService} from "@shared/service/data.service";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {NoticeComponent} from "../component/notice/notice.component";
import {UtilsService} from "@shared/service/utils.service";
import {NzNotificationComponent, NzNotificationService} from "ng-zorro-antd/notification";
import {AnnouncementDetailComponent} from "../component/announcement-detail/announcement-detail.component";
import {NoticeDetailComponent} from "../component/notice-detail/notice-detail.component";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {I18NService} from "@core";

/** Payload of a notice pushed over the websocket. */
export interface NoticePush {
    id: number;
    title: string;
    content: string;
}

@Component({
    standalone: false,
    selector: "layout-header",
    templateUrl: "./header.component.html",
    styleUrls: [
        "./header.component.less"
    ]
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() menu: MenuVo[];

    @ViewChild("noticeTpl", {static: true}) noticeTpl: TemplateRef<{ $implicit: NzNotificationComponent; data: NoticePush }>;

    private destroy$ = new Subject<void>();

    splitTopItems: Menu[] = [];

    get splitMenu(): boolean {
        return !!this.settings.layout['splitMenu'];
    }

    // ── Top-split mode: first-level tabs in the header (same tabs as split mode),
    // the selected category's children in a sub-nav row under the header ──
    get topSplitMenu(): boolean {
        return !!this.settings.layout['topSplitMenu'];
    }

    // Category whose children fill the sidebar (split) or the sub-nav row (top-split):
    // the persisted splitMenuKey, else the first one.
    get selectedTopItem(): Menu | null {
        return selectedTopMenu(this.splitTopItems, this.settings.layout);
    }

    isActiveSplitItem(item: Menu): boolean {
        const key = this.settings.layout['splitMenuKey'];
        return !!key && (item.key === key || item.text === key);
    }

    selectSplitItem(item: Menu): void {
        this.settings.setLayout('splitMenuKey', item.key || item.text);
        if (!item.children?.length) {
            this.navigateTopItem(item);
        }
    }

    // ── Top-menu mode: the full menu tree rendered in the header ──────────
    get topMenu(): boolean {
        return !!this.settings.layout['topMenu'];
    }

    // MenuService.open() marks every item on the active trail as _selected, so a
    // first-level item is active whenever the current route lives under it.
    isActiveTopItem(item: Menu): boolean {
        return !!(item as MenuInner)._selected;
    }

    navigateTopItem(item: Menu): void {
        if (item.disabled) return;
        if (item.externalLink) {
            item.target === '_blank'
                ? window.open(item.externalLink)
                : (window.location.href = item.externalLink);
        } else if (item.link) {
            this.ngZone.run(() => this.router.navigateByUrl(item.link!));
        }
    }

    // The split nav hides its scrollbar; on Windows mice have no horizontal wheel,
    // so translate vertical wheel delta into horizontal scrolling.
    onSplitNavWheel(event: WheelEvent): void {
        const el = event.currentTarget as HTMLElement;
        if (el.scrollWidth <= el.clientWidth) return;
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            el.scrollLeft += event.deltaY;
            event.preventDefault();
        }
    }

    searchToggleStatus: boolean;

    isFullScreen: boolean = false;

    collapse: boolean = false;

    logoPath: string = WindowModel.logoPath;

    logoFoldPath: string = WindowModel.logoFoldPath;

    logoText: string = WindowModel.logoText;

    // Whether the brand block is actually standing over a collapsed sidebar.
    // The header-menu layouts have no sidebar at all, so the persisted
    // `collapsed` flag says nothing there and the block stays full width —
    // mirrors the `alain-default__top-menu` condition in erupt.component.
    get sidebarCollapsed(): boolean {
        if (!this.settings.layout.collapsed) {
            return false;
        }
        if (this.topMenu || this.topSplitMenu) {
            return false;
        }
        return !(this.splitMenu && !this.selectedTopItem?.children?.length);
    }

    // Stands in for the collapsed brand mark when no logo was configured:
    // the site's own first character, which is never another product's mark.
    get logoInitial(): string {
        return (this.logoText || WindowModel.title || "").trim().charAt(0).toUpperCase();
    }

    r_tools: CustomerTool[] = WindowModel.r_tools;

    drawerVisible: boolean = false;


    showI18n: boolean = true;

    tenantDomainInfo = EruptTenantInfoData.get();

    unreadCount: number = 0;

    aiLoading: boolean = false;

    get isEruptAi(): boolean {
        return EruptAppData.get().properties["erupt-ai"] && null != this.menuSrv.getItem("ai-chat");
    }

    // Notices and announcements are keyed by platform user id; tenant sessions get no entry point
    // (bell, unread polling, announcement popups all hang off this flag)
    get isEruptNotice(): boolean {
        return EruptAppData.get().properties["erupt-notice"] && !this.utilsService.isTenantToken();
    }

    openDrawer() {
        this.drawerVisible = true;
    }

    closeDrawer(): void {
        this.drawerVisible = false;
    }

    refreshing: boolean = false;

    constructor(public settings: SettingsService,
                private router: Router,
                private ngZone: NgZone,
                private dataService: DataService,
                private menuSrv: MenuService,
                private utilsService: UtilsService,
                private i18n: I18NService,
                @Inject(NzDrawerService) private drawer: NzDrawerService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzNotificationService) private notification: NzNotificationService,
                @Inject(ReuseTabService) private reuseTabSrv: ReuseTabService) {
        if (this.tenantDomainInfo && this.tenantDomainInfo.logo) {
            this.logoPath = DataService.previewAttachment(this.tenantDomainInfo.logo);
            // The tenant's logo is its own brand, so it also stands in for the
            // collapsed mark; only an explicitly configured fold logo beats it.
            if (!WindowModel.config["logoFoldPath"]) {
                this.logoFoldPath = this.logoPath;
            }
        }
    }

    // The browser chrome color (<meta name="theme-color">, owned by index.html) is read
    // off the painted bar, which only exists from here on
    ngAfterViewInit() {
        window["eruptSyncThemeColor"]?.();
    }

    ngOnInit() {
        this.menuSrv.change.pipe(takeUntil(this.destroy$)).subscribe(data => {
            this.splitTopItems = topLevelMenus(data);
        });
        this.r_tools.forEach(tool => {
            tool.load && tool.load();
        });
        if (EruptAppData.get().locales.length <= 1) {
            this.showI18n = false;
        }
        if (this.isEruptNotice) {
            this.getNoticeUnreadCount();
            window["eruptNotice"] = this.eruptNotice.bind(this);
            this.dataService.announcementPopups().subscribe(res => {
                if (res.data.length > 0) {
                    for (let ann of res.data) {
                        let ref = this.modal.create({
                            nzDraggable: true,
                            nzWrapClassName: "modal-lg",
                            nzTitle: ann.title,
                            nzBodyStyle: {
                                padding: '0'
                            },
                            nzFooter: null,
                            nzContent: AnnouncementDetailComponent,
                            nzKeyboard: false,
                            nzMaskClosable: false,
                            nzOnCancel: () => {
                                this.dataService.announcementMarkRead(ann.id).subscribe(res => {
                                    ref.close();
                                });
                            }
                        });
                        ref.componentInstance.announcement = ann;
                    }
                }
            });
        }
    }

    getNoticeUnreadCount() {
        this.dataService.noticeUnreadCount().subscribe(res => {
            this.unreadCount = res.data;
        })
    }

    /** Pushed over the websocket by the backend notice channel (window.eruptNotice). */
    eruptNotice(id: number, title: string, content: string) {
        this.unreadCount++;
        this.notification.template(this.noticeTpl, {
            nzDuration: -1,
            nzData: {id, title, content}
        });
    }

    /** Opens the pushed notice in the same detail modal the notice center uses; that read marks it read. */
    viewPushedNotice(notice: NoticePush, toast: NzNotificationComponent) {
        toast.close();
        const ref = this.modal.create({
            nzDraggable: true,
            nzWrapClassName: "modal-lg",
            nzTitle: notice.title,
            nzBodyStyle: {padding: '0'},
            nzFooter: null,
            nzContent: NoticeDetailComponent
        });
        ref.componentInstance.messageId = notice.id;
        ref.afterClose.subscribe(() => this.getNoticeUnreadCount());
    }

    renderTool(tool: CustomerTool): string {
        if (typeof tool.render == 'function') {
            return tool.render();
        } else {
            return tool.render;
        }
    }

    async openEruptAi() {
        if (this.aiLoading) return;
        this.aiLoading = true;
        const {AiChatComponent} = await import('../../../build/ai/view/ai-chat/ai-chat.component');
        // await on the native import() promise escapes the Angular zone (zone.js cannot
        // patch native async/await), so re-enter the zone before creating the drawer —
        // otherwise every async operation inside the drawer misses change detection.
        this.ngZone.run(() => {
            this.aiLoading = false;
            openResizableDrawer(this.drawer, {
                nzTitle: null,
                nzContent: AiChatComponent,
                nzWidth: "520px",
                nzMask: false,
                nzClosable: false,
                nzKeyboard: true,
                nzPlacement: "right",
                nzBodyStyle: {
                    padding: "0",
                    overflow: "hidden"
                },
                nzContentParams: {
                    embedded: true,
                    drawerTitle: this.i18n.fanyi('ai.chat.title')
                }
            }, "header-ai");
        });
    }

    openEruptNotice() {
        openResizableDrawer(this.drawer, {
            nzTitle: null,
            nzContent: NoticeComponent,
            nzWidth: "360px",
            nzFooter: null,
            nzClosable: false,
            nzMaskClosable: true,
            nzKeyboard: true,
            nzPlacement: "right",
            nzBodyStyle: {
                padding: "0"
            },
        }, "notice").afterClose.subscribe(res => {
            this.getNoticeUnreadCount();
        });
    }

    toggleCollapsedSidebar() {
        this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
    }

    searchToggleChange() {
        this.searchToggleStatus = !this.searchToggleStatus;
    }

    toggleScreen() {
        let sf = screenfull;
        if (sf.isEnabled) {
            this.isFullScreen = !sf.isFullscreen;
            sf.toggle();
        }
    }

    customToolsFun(event: Event, tool: CustomerTool) {
        tool.click && tool.click(event);
    }

    refreshPage() {
        const url = this.router.url;
        this.refreshing = true;
        this.reuseTabSrv.close(url, true);
        // shouldReuseRoute returns true for same-URL navigation so the component won't
        // be recreated. Go through '/' first (different routeConfig) with skipLocationChange
        // so the address bar never changes, then navigate to target URL for a clean reload.
        this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
            this.router.navigateByUrl(url).then(() => {
                setTimeout(() => this.refreshing = false, 300);
            });
        });
    }

    toIndex() {
        this.router.navigateByUrl(this.settings.user['indexPath']);
        return false;
    }

    search() {
        let model = this.modal.create({
            nzWrapClassName: "modal-xs",
            nzDraggable: true,
            nzMaskClosable: true,
            nzKeyboard: true,
            nzFooter: null,
            nzClosable: false,
            nzBodyStyle: {
                padding: "12px"
            },
            nzContent: HeaderSearchComponent
        });
        model.getContentComponent().menu = this.menu
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        // The bar is gone (e.g. back to the login page): let the chrome color follow whatever
        // surface replaces it
        window["eruptSyncThemeColor"]?.();
    }

}
