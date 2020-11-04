import {AfterViewInit, Component} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd";

@Component({
    selector: "layout-passport",
    templateUrl: "./passport.component.html",
    styleUrls: ["./passport.component.less"]
})
export class LayoutPassportComponent implements AfterViewInit {

    nowYear = new Date().getFullYear();

    logoPath: string = WindowModel.logoPath;

    desc = WindowModel.desc;

    title = WindowModel.title;

    constructor(private modalSrv: NzModalService) {
    }

    ngAfterViewInit(): void {
        this.modalSrv.closeAll();
    }

    links = [
        {
            title: "帮助",
            href: ""
        },
        {
            title: "隐私",
            href: ""
        },
        {
            title: "条款",
            href: ""
        }
    ];
}
