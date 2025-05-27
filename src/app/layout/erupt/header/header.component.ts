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

    get isEruptAi(): boolean {
        return EruptAppData.get().properties["erupt-ai"];
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
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                @Inject(NzModalService) private modal: NzModalService) {
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
