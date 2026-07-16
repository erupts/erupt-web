import {Component, Inject, Input, NgZone, OnDestroy, OnInit} from "@angular/core";
import {Menu, MenuService, SettingsService} from "@delon/theme";
import {Subject, takeUntil} from "rxjs";
import screenfull from 'screenfull';
import {CustomerTool, WindowModel} from "@shared/model/window.model";
import {Router} from "@angular/router";
import {NzModalService} from "ng-zorro-antd/modal";
import {HeaderSearchComponent} from "./components/search.component";
import {MenuVo} from "@shared/model/erupt-menu";
import {AppViewService} from "@shared/service/app-view.service";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {EruptTenantInfoData} from "../../../build/erupt/model/erupt-tenant";
import {DataService} from "@shared/service/data.service";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {NoticeComponent} from "../component/notice/notice.component";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {AnnouncementDetailComponent} from "../component/announcement-detail/announcement-detail.component";
import {ReuseTabService} from "@delon/abc/reuse-tab";

@Component({
    standalone: false,
    selector: "layout-header",
    templateUrl: "./header.component.html",
    styleUrls: [
        "./header.component.less"
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {

    @Input() menu: MenuVo[];

    private destroy$ = new Subject<void>();

    splitTopItems: Menu[] = [];

    get splitMenu(): boolean {
        return !!this.settings.layout['splitMenu'];
    }

    isActiveSplitItem(item: Menu): boolean {
        const key = this.settings.layout['splitMenuKey'];
        return !!key && (item.key === key || item.text === key);
    }

    selectSplitItem(item: Menu): void {
        this.settings.setLayout('splitMenuKey', item.key || item.text);
        if (!item.children?.length) {
            if (item.externalLink) {
                item.target === '_blank'
                    ? window.open(item.externalLink)
                    : (window.location.href = item.externalLink);
            } else if (item.link) {
                this.appViewService.setRouterViewDesc(null);
                this.ngZone.run(() => this.router.navigateByUrl(item.link!));
            }
        }
    }

    searchToggleStatus: boolean;

    isFullScreen: boolean = false;

    collapse: boolean = false;

    logoPath: string = WindowModel.logoPath;

    logoFoldPath: string = WindowModel.logoFoldPath;

    logoText: string = WindowModel.logoText;

    r_tools: CustomerTool[] = WindowModel.r_tools;

    drawerVisible: boolean = false;

    desc: string;

    showI18n: boolean = true;

    tenantDomainInfo = EruptTenantInfoData.get();

    unreadCount: number = 0;

    aiLoading: boolean = false;

    get isEruptAi(): boolean {
        return EruptAppData.get().properties["erupt-ai"] && null != this.menuSrv.getItem("ai-chat");
    }

    get isEruptNotice(): boolean {
        return EruptAppData.get().properties["erupt-notice"];
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
                private appViewService: AppViewService,
                private dataService: DataService,
                private menuSrv: MenuService,
                @Inject(NzDrawerService) private drawer: NzDrawerService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzNotificationService) private notification: NzNotificationService,
                @Inject(ReuseTabService) private reuseTabSrv: ReuseTabService) {
        if (this.tenantDomainInfo) {
            if (this.tenantDomainInfo.logo) {
                this.logoPath = DataService.previewAttachment(this.tenantDomainInfo.logo)
            }
        }
    }

    ngOnInit() {
        this.menuSrv.change.pipe(takeUntil(this.destroy$)).subscribe(data => {
            this.splitTopItems = data.flatMap(g => (g.children || []).filter(i => !i['_hidden']));
        });
        this.r_tools.forEach(tool => {
            tool.load && tool.load();
        });
        this.appViewService.routerViewDescSubject.subscribe(value => {
            this.desc = value;
        })
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

    eruptNotice(id: number, title: string, content: string) {
        this.unreadCount++;
        this.notification.create(
            'blank',
            title,
            content, {
                nzDuration: -1
            }
        );
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
        this.aiLoading = false;
        this.drawer.create({
            nzTitle: "AI Chat",
            nzContent: AiChatComponent,
            nzWidth: "520px",
            nzMask: false,
            nzClosable: true,
            nzKeyboard: true,
            nzPlacement: "right",
            nzBodyStyle: {
                padding: "0",
                overflow: "hidden"
            },
            nzContentParams: {
                embedded: true
            }
        });
    }

    openEruptNotice() {
        this.drawer.create({
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
        }).afterClose.subscribe(res => {
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
    }

}
