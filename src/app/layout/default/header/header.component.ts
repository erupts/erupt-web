import {Component, Inject, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";
import * as screenfull from "screenfull";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {CustomerTool, WindowModel} from "@shared/model/window.model";
import {Router} from "@angular/router";

@Component({
    selector: "layout-header",
    templateUrl: "./header.component.html",
    styleUrls: [
        "./header.component.less"
    ]
})
export class HeaderComponent implements OnInit {

    isFullScreen: boolean = false;

    collapse: boolean = false;

    title = WindowModel.title;

    logoPath: string = WindowModel.logoPath;

    r_tools: CustomerTool[] = WindowModel.r_tools;

    constructor(public settings: SettingsService, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService, private router: Router) {
    }

    ngOnInit() {
        this.r_tools.forEach(tool => {
            tool.load && tool.load(event, this.tokenService.get().token);
        });
    }

    toggleScreen() {
        let sf = screenfull as screenfull.Screenfull;
        if (sf.isEnabled) {
            this.isFullScreen = !sf.isFullscreen;
            sf.toggle();
        }
    }

    customToolsFun(event: Event, tool: CustomerTool) {
        tool.click && tool.click(event, this.tokenService.get().token);
    }

    refresh() {
        // this.router.navigate([window.location.hash.substring(1)], {
        //     queryParams: {
        //         _: new Date().getTime()
        //     }
        // }).then((bool) => {
        //     console.log(bool);
        // });
    }
}