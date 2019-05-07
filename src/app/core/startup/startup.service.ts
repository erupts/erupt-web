import { Injectable, Injector, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { zip } from "rxjs";
import { catchError } from "rxjs/operators";
import { MenuService, SettingsService, TitleService, ALAIN_I18N_TOKEN } from "@delon/theme";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";
import { ACLService } from "@delon/acl";

import { NzIconService } from "ng-zorro-antd";
import { ICONS_AUTO } from "../../../style-icons-auto";
import { ICONS } from "../../../style-icons";
import { DataService } from "../../erupt/service/data.service";

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
              @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
              private httpClient: HttpClient,
              private data: DataService) {
    iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
  }

  private viaHttp(resolve: any, reject: any) {
    zip(
      this.httpClient.get("assets/tmp/app-data.json")
    ).pipe(
      // 接收其他拦截器后产生的异常消息
      catchError(([appData]) => {
        resolve(null);
        return [appData];
      })
    ).subscribe(([appData]) => {

        // application data
        const res: any = appData;
        // 应用信息：包括站点名、描述、年份
        this.settingService.setApp(res.app);
        // 用户信息：包括姓名、头像、邮箱地址
        this.settingService.setUser(res.user);
        // ACL：设置权限为全量
        this.aclService.setFull(true);
        // 初始化菜单
        this.menuService.add(res.menu);
        // 设置页面标题的后缀
        this.titleService.suffix = res.app.name;
      },
      () => {
      },
      () => {
        resolve(null);
      });
  }

  private viaMock(resolve: any, reject: any) {
    // const tokenData = this.tokenService.get();
    // if (!tokenData.token) {
    //   this.injector.get(Router).navigateByUrl('/passport/login');
    //   resolve({});
    //   return;
    // }
    // mock
    // 应用信息：包括站点名、描述、年份
    this.settingService.setApp(window["site"]);
    // ACL：设置权限为全量
    this.aclService.setFull(true);
    // 设置页面标题的后缀
    this.titleService.suffix = this.settingService.app.name;
    resolve({});
  }

  load(): Promise<any> {
    // console.log("%c YuePeng Erupt Framework",
    //   " text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1)," +
    //   "0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px" +
    //   " rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);font-size:2em");

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
