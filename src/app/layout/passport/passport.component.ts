import {AfterViewInit, Component} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {EruptTenantInfoData} from "../../build/erupt/model/erupt-tenant";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: "layout-passport",
    templateUrl: "./passport.component.html",
    styleUrls: ["./passport.component.less"]
})
export class LayoutPassportComponent implements AfterViewInit {

    nowYear = new Date().getFullYear();

    logoPath: string = WindowModel.loginLogoPath;

    desc = WindowModel.desc;

    title = WindowModel.title;

    copyright = WindowModel.copyright;

    copyrightTxt = WindowModel.copyrightTxt;

    tenantDomainInfo = EruptTenantInfoData.get();

    constructor(private modalSrv: NzModalService) {
        if (WindowModel.copyrightTxt) {
            if (typeof (WindowModel.copyrightTxt) === 'function') {
                this.copyrightTxt = WindowModel.copyrightTxt();
            } else {
                this.copyrightTxt = WindowModel.copyrightTxt;
            }
        }
        if (this.tenantDomainInfo) {
            if (this.tenantDomainInfo.logo) {
                this.logoPath = DataService.previewAttachment(this.tenantDomainInfo.logo)
            }
        }
    }

    ngAfterViewInit(): void {
        this.modalSrv.closeAll();
    }

}
