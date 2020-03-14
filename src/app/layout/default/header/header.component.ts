import {Component, Inject, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";
import * as screenfull from "screenfull";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {CustomerTool, WindowModel} from "@shared/model/window.model";
import {Router} from "@angular/router";
import {CacheService} from "@delon/cache";

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

    isDark: boolean;

    constructor(public settings: SettingsService,
                @Inject(DA_SERVICE_TOKEN)
                private tokenService: ITokenService,
                private cacheService: CacheService) {
    }

    ngOnInit() {
        this.isDark = this.cacheService.getNone("dark") || false;
        if (this.isDark) {
            document.body.className = "dark";
        }
        this.r_tools.forEach(tool => {
            tool.load && tool.load(event, this.tokenService.get().token);
        });
    }

    toggleDark() {
        if (this.isDark) {
            document.body.className = "";
        } else {
            document.body.className = "dark";
        }
        this.isDark = !this.isDark;
        this.cacheService.set("dark", this.isDark);
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