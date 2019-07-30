import { Inject, Injectable } from "@angular/core";
import { MenuService, SettingsService, TitleService } from "@delon/theme";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";
import { ACLService } from "@delon/acl";

import { NzIconService } from "ng-zorro-antd";
import { ICONS_AUTO } from "../../../style-icons-auto";
import { ICONS } from "../../../style-icons";
import { WindowModel } from "../../erupt/model/window.model";

/**
 * 用于应用启动时
 * 一般用来获取应用所需要的基础数据等
 */
@Injectable()
export class StartupService {
  constructor(iconSrv: NzIconService,
              private menuService: MenuService,
              private settingService: SettingsService,
              private aclService: ACLService,
              private titleService: TitleService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
  }


  private viaMock(resolve: any, reject: any) {
    // 应用信息：包括站点名、描述、年份
    this.settingService.setApp({
      name: WindowModel.title,
      description: WindowModel.desc
    });
    // 设置页面标题的后缀
    this.titleService.suffix = this.settingService.app.name;
    resolve({});
  }

  load(): Promise<any> {
    console.log("%c YuePeng Erupt Framework",
      " text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1)," +
      "0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px" +
      " rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);font-size:2em");

    // only works with promises
    // https://github.com/angular/angular/issues/15088
    return new Promise((resolve, reject) => {
      // http
      // this.viaHttp(resolve, reject);
      // mock：请勿在生产环境中这么使用，viaMock 单纯只是为了模拟一些数据使脚手架一开始能正常运行
      this.viaMock(resolve, reject);

    });
  }
}
