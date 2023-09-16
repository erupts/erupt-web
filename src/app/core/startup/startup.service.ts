import {Inject, Injectable} from "@angular/core";
import {SettingsService, TitleService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

import {ICONS_AUTO} from "../../../style-icons-auto";
import {WindowModel} from "@shared/model/window.model";
import {GlobalKeys} from "@shared/model/erupt-const";
import {RestPath} from "../../build/erupt/model/erupt.enum";
import {EruptAppData, EruptAppModel} from "@shared/model/erupt-app.model";
import {HttpClient} from "@angular/common/http";
import {NzIconService} from "ng-zorro-antd/icon";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {I18NService} from "../i18n/i18n.service";

/**
 * 用于应用启动时
 * 一般用来获取应用所需要的基础数据等
 */
@Injectable()
export class StartupService {
    constructor(iconSrv: NzIconService,
                private reuseTabService: ReuseTabService,
                private settingService: SettingsService,
                private titleService: TitleService,
                private settingSrv: SettingsService,
                private httpClient: HttpClient,
                private i18n: I18NService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        iconSrv.addIcon(...ICONS_AUTO);
    }

    async load(): Promise<any> {
        console.group(WindowModel.copyright ? "Erupt All rights reserved." : WindowModel.title);
        console.log("%c" +
            "                               __      \n" +
            "                              /\\ \\__   \n" +
            "   __   _ __   __  __   _____ \\ \\ ,_\\  \n" +
            " /'__`\\/\\`'__\\/\\ \\/\\ \\ /\\ '__`\\\\ \\ \\/  \n" +
            "/\\  __/\\ \\ \\/ \\ \\ \\_\\ \\\\ \\ \\L\\ \\\\ \\ \\_ \n" +
            "\\ \\____\\\\ \\_\\  \\ \\____/ \\ \\ ,__/ \\ \\__\\\n" +
            " \\/____/ \\/_/   \\/___/   \\ \\ \\/   \\/__/\n" +
            "                          \\ \\_\\        \n" +
            "                           \\/_/        ", "color:#2196f3;font-weight:800");
        console.log("%chttps://www.erupt.xyz", "color:#2196f3;font-size:1.3em;padding:16px 0;");
        console.groupEnd();
        (window as any).eruptWebSuccess = true;
        await new Promise<void>((resolve) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', RestPath.eruptApp);
            xhr.send();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    EruptAppData.put(<EruptAppModel>JSON.parse(xhr.responseText));
                    resolve();
                } else if (xhr.status !== 200) {
                    setTimeout(() => {
                        location.href = location.href.split("#")[0];
                    }, 3000);
                }
            };
        });
        //注入全局方法：token
        window[GlobalKeys.getAppToken] = () => {
            return this.tokenService.get();
        };
        if (WindowModel.eruptEvent) {
            WindowModel.eruptEvent.startup && WindowModel.eruptEvent.startup();
        }
        //路由复用
        this.settingSrv.layout['reuse'] = !!this.settingSrv.layout['reuse'];
        //表格边框
        this.settingSrv.layout['bordered'] = false !== this.settingSrv.layout['bordered'];
        //面包靴导航
        this.settingSrv.layout['breadcrumbs'] = false !== this.settingSrv.layout['breadcrumbs'];

        if (this.settingSrv.layout['reuse']) {
            this.reuseTabService.mode = 0;
            this.reuseTabService.excludes = [];
        } else {
            this.reuseTabService.mode = 2;
            this.reuseTabService.excludes = [/\d*/];
        }
        return new Promise((resolve) => {
            // 应用信息：包括站点名、描述、年份
            this.settingService.setApp({
                name: WindowModel.title,
                description: WindowModel.desc
            });
            // 设置页面标题的后缀
            this.titleService.suffix = WindowModel.title;
            this.titleService.default = "";
            this.i18n.loadLangData(() => {
                resolve(null);
            })
        });
    }
}
