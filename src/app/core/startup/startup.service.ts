import {Inject, Injectable} from "@angular/core";
import {SettingsService, TitleService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

import {NzIconService} from "ng-zorro-antd";
import {ICONS_AUTO} from "../../../style-icons-auto";
import {ICONS} from "../../../style-icons";
import {WindowModel} from "@shared/model/window.model";

/**
 * 用于应用启动时
 * 一般用来获取应用所需要的基础数据等
 */
@Injectable()
export class StartupService {
    constructor(iconSrv: NzIconService,
                private settingService: SettingsService,
                private titleService: TitleService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
    }

    load(): Promise<any> {
        console.group("Action");
        console.log("%c" +
            "                               __      \n" +
            "                              /\\ \\__   \n" +
            "   __   _ __   __  __   _____ \\ \\ ,_\\  \n" +
            " /'__`\\/\\`'__\\/\\ \\/\\ \\ /\\ '__`\\\\ \\ \\/  \n" +
            "/\\  __/\\ \\ \\/ \\ \\ \\_\\ \\\\ \\ \\L\\ \\\\ \\ \\_ \n" +
            "\\ \\____\\\\ \\_\\  \\ \\____/ \\ \\ ,__/ \\ \\__\\\n" +
            " \\/____/ \\/_/   \\/___/   \\ \\ \\/   \\/__/\n" +
            "                          \\ \\_\\        \n" +
            "                           \\/_/        ", "color:#2196f3");
        console.log("%cDocument : https://www.erupt.xyz", "color:#2196f3;font-size:1.3em;padding:16px 0");
        console.groupEnd();
        let eruptEvent = window["eruptEvent"];
        if (eruptEvent) {
            eruptEvent.startup && eruptEvent.startup();
        }
        return new Promise((resolve, reject) => {
            // 应用信息：包括站点名、描述、年份
            this.settingService.setApp({
                name: WindowModel.title,
                description: WindowModel.desc
            });
            // 设置页面标题的后缀
            this.titleService.suffix = WindowModel.title;
            this.titleService.default = "";
            resolve({});
        });
    }
}
