/**
 * 进一步对基础模块的导入提炼
 * 有关模块注册指导原则请参考：https://github.com/ng-alain/ng-alain/issues/180
 */
import {
  NgModule,
  Optional,
  SkipSelf,
  ModuleWithProviders
} from "@angular/core";
import { throwIfAlreadyLoaded } from "@core/module-import-guard";

import { AlainThemeModule } from "@delon/theme";
import { DelonABCModule, STConfig } from "@delon/abc";
import { DelonChartModule } from "@delon/chart";
import { DelonAuthModule } from "@delon/auth";
import { DelonCacheModule } from "@delon/cache";
import { DelonUtilModule } from "@delon/util";

// #endregion

// #region reuse-tab
/**
 * 若需要[路由复用](https://ng-alain.com/components/reuse-tab)需要：
 * 1、增加 `REUSETAB_PROVIDES`
 * 2、在 `src/app/layout/default/default.component.html` 修改：
 *  ```html
 *  <section class="alain-default__content">
 *    <reuse-tab></reuse-tab>
 *    <router-outlet></router-outlet>
 *  </section>
 *  ```
 */
import { RouteReuseStrategy } from "@angular/router";
import { ReuseTabService, ReuseTabStrategy } from "@delon/abc/reuse-tab";

let REUSETAB_PROVIDES = [];
if (WindowModel.routerReuse) {
  REUSETAB_PROVIDES = [
    {
      provide: RouteReuseStrategy,
      useClass: ReuseTabStrategy,
      deps: [ReuseTabService]
    }
  ];
}
// #endregion

// #region global config functions

import { PageHeaderConfig } from "@delon/abc";

export function fnPageHeaderConfig(): PageHeaderConfig {
  return Object.assign(new PageHeaderConfig());
}

import { DelonAuthConfig } from "@delon/auth";
import { WindowModel } from "@shared/model/window.model";

export function fnDelonAuthConfig(): DelonAuthConfig {
  return Object.assign(new DelonAuthConfig(), <DelonAuthConfig>{
    login_url: "/passport/login"
  });
}

export function fnSTConfig(): STConfig {
  return Object.assign(new STConfig(), <STConfig>{
    modal: { size: "lg" }
  });
}

const GLOBAL_CONFIG_PROVIDES = [
  // TIPS：@delon/abc 有大量的全局配置信息，例如设置所有 `st` 的页码默认为 `20` 行
  { provide: STConfig, useFactory: fnSTConfig },
  { provide: PageHeaderConfig, useFactory: fnPageHeaderConfig },
  { provide: DelonAuthConfig, useFactory: fnDelonAuthConfig }
];

// #endregion

@NgModule({
  imports: [
    AlainThemeModule.forRoot(),
    DelonABCModule,
    DelonChartModule,
    DelonAuthModule,
    DelonCacheModule,
    DelonUtilModule
  ]
})
export class DelonModule {
  constructor(
    @Optional()
    @SkipSelf()
      parentModule: DelonModule
  ) {
    throwIfAlreadyLoaded(parentModule, "DelonModule");
  }

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: DelonModule,
      providers: [...REUSETAB_PROVIDES, ...GLOBAL_CONFIG_PROVIDES]
    };
  }
}
