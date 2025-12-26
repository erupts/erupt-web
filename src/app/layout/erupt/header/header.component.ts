import {Component, Inject, Input, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";
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
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {NoticeComponent} from "../component/notice/notice.component";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {AnnouncementDetailComponent} from "../component/announcement-detail/announcement-detail.component";

@Component({
    selector: "layout-header",
    templateUrl: "./header.component.html",
    styleUrls: [
        "./header.component.less"
    ]
})
export class HeaderComponent implements OnInit {

    @Input() menu: MenuVo[];

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

    get isEruptAi(): boolean {
        return EruptAppData.get().properties["erupt-ai"];
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

    constructor(public settings: SettingsService,
                private router: Router,
                private appViewService: AppViewService,
                private dataService: DataService,
                @Inject(NzDrawerService) private drawer: NzDrawerService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzNotificationService) private notification: NzNotificationService) {
        if (this.tenantDomainInfo) {
            if (this.tenantDomainInfo.logo) {
                this.logoPath = DataService.previewAttachment(this.tenantDomainInfo.logo)
            }
        }
    }

    ngOnInit() {
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

    openEruptAi() {
        let model = this.modal.create({
            nzWrapClassName: "modal-lg",
            nzMaskClosable: false,
            nzKeyboard: true,
            nzFooter: null,
            nzClosable: true,
            nzTitle: "AI 交互",
            nzStyle: {
                top: '30px',
            },
            nzBodyStyle: {
                padding: "0"
            },
            nzContent: EruptIframeComponent,
        });
        model.getContentComponent().url = "ai-chat.html?_token=" + this.tokenService.get().token;
        model.getContentComponent().height = "83vh"
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

    toIndex() {
        this.router.navigateByUrl(this.settings.user['indexPath']);
        return false;
    }

    search() {
        let model = this.modal.create({
            nzWrapClassName: "modal-xs",
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

}
