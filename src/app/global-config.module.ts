import {ModuleWithProviders, NgModule, Optional, SkipSelf} from '@angular/core';
import {DelonACLModule} from '@delon/acl';
import {AlainThemeModule} from '@delon/theme';
import {AlainConfig, ALAIN_CONFIG} from '@delon/util/config';
import {ReuseTabModule} from '@delon/abc/reuse-tab';
import {throwIfAlreadyLoaded} from '@core';
import {environment} from '@env/environment';
import {GANTT_GLOBAL_CONFIG, GANTT_I18N_LOCALE_TOKEN, zhHansLocale} from '@worktile/gantt';


const alainConfig: AlainConfig = {
    st: {modal: {size: 'lg'}},
    pageHeader: {homeI18n: 'home'},
    auth: {
        login_url: '/passport/login',
        ignores: [
            /\/erupt-app$/,
            /\/tenant\/domain-info$/,
            /erupt-api\/login/,
            /erupt-api\/tenant\/login/
        ]
    }
};

const alainModules: any[] = [AlainThemeModule.forRoot(), DelonACLModule, ReuseTabModule];
const alainProvides: any[] = [{provide: ALAIN_CONFIG, useValue: alainConfig}];

// #region reuse-tab
/**
 * 若需要[路由复用](https://ng-alain.com/components/reuse-tab)需要：
 * 1、在 `shared-delon.module.ts` 导入 `ReuseTabModule` 模块
 * 2、注册 `"RouteReuseStrategy`
 * 3、在 `src/app/layout/erupt/erupt.component.html` 修改：
 *  ```html
 *  <section class="alain-default__content">
 *    <reuse-tab #reuseTab></reuse-tab>
 *    <router-outlet (activate)="reuseTab.activate($event)"></router-outlet>
 *  </section>
 *  ```
 */
import {RouteReuseStrategy} from '@angular/router';
import {ReuseTabService, ReuseTabStrategy} from '@delon/abc/reuse-tab';

// 显式提供 ReuseTabService
alainProvides.push(ReuseTabService);
alainProvides.push({
    provide: RouteReuseStrategy,
    useClass: ReuseTabStrategy,
    deps: [ReuseTabService],
} as any);

// #region NG-ZORRO Config

import {NzConfig, NZ_CONFIG} from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {};

const zorroProvides = [{provide: NZ_CONFIG, useValue: ngZorroConfig}];

// #endregion

// #region Gantt Config

const ganttProvides = [
    {provide: GANTT_GLOBAL_CONFIG, useValue: {}},
    {provide: GANTT_I18N_LOCALE_TOKEN, useValue: [zhHansLocale]}
];

// #endregion

@NgModule({
    imports: [...alainModules, ...(environment.modules || [])],
    exports: []
})
export class GlobalConfigModule {
    constructor(@Optional() @SkipSelf() parentModule: GlobalConfigModule) {
        throwIfAlreadyLoaded(parentModule, 'GlobalConfigModule');
    }

    static forRoot(): ModuleWithProviders<GlobalConfigModule> {
        return {
            ngModule: GlobalConfigModule,
            providers: [...alainProvides, ...zorroProvides, ...ganttProvides]
        };
    }
}
