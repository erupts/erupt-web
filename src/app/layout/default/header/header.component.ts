import {Component, Inject, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";
import screenfull from 'screenfull';
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {CustomerTool, WindowModel} from "@shared/model/window.model";
import {CacheService} from "@delon/cache";
import {Router} from "@angular/router";
import {NzModalService} from "ng-zorro-antd/modal";
import {ViewTypeComponent} from "../../../build/erupt/components/view-type/view-type.component";
import {HeaderSearchComponent} from "./components/search.component";

@Component({
    selector: "layout-header",
    templateUrl: "./header.component.html",
    styleUrls: [
        "./header.component.less"
    ]
})
export class HeaderComponent implements OnInit {

    searchToggleStatus: boolean;

    isFullScreen: boolean = false;

    collapse: boolean = false;

    title = WindowModel.title;

    logoPath: string = WindowModel.logoPath;

    logoText: string = WindowModel.logoText;

    r_tools: CustomerTool[] = WindowModel.r_tools;

    drawerVisible: boolean = false;

    openDrawer() {
        this.drawerVisible = true;
    }

    closeDrawer(): void {
        this.drawerVisible = false;
    }

    constructor(public settings: SettingsService,
                private router: Router,
                @Inject(DA_SERVICE_TOKEN)
                @Inject(NzModalService) private modal: NzModalService) {
    }

    ngOnInit() {
        this.r_tools.forEach(tool => {
            tool.load && tool.load();
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
        this.modal.create({
            nzWrapClassName: "modal-xs",
            nzMaskClosable: true,
            nzKeyboard: true,
            nzFooter: null,
            nzClosable: false,
            nzBodyStyle: {
                padding: "12px"
            },
            nzContent: HeaderSearchComponent
        })
    }

}
