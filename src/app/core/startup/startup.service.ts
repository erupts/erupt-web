import {Inject, Injectable} from "@angular/core";
import {MenuService, SettingsService, TitleService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

import {NzIconService} from "ng-zorro-antd";
import {ICONS_AUTO} from "../../../style-icons-auto";
import {ICONS} from "../../../style-icons";
import {WindowModel} from "@shared/model/window.model";
import {ActivatedRoute, Router} from "@angular/router";

/**
 * 用于应用启动时
 * 一般用来获取应用所需要的基础数据等
 */
@Injectable()
export class StartupService {
    constructor(iconSrv: NzIconService,
                private menuService: MenuService,
                private settingService: SettingsService,
                private titleService: TitleService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
    }

    load(): Promise<any> {
        console.log("%c Erupt Framework %chttps://www.erupt.xyz"
            ,`color:#fff;margin:10px;margin-left:0;font-size:1.8em;
            font-family: Courier New, Menlo, Monaco, Consolas, monospace;
            font-width:800;background:#FF5722;padding:10px 30px`
            ,"font-size:1.6em;margin-bottom:10px");
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
