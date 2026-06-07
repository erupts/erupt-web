import {ModuleWithProviders, NgModule, Optional, SkipSelf} from '@angular/core';
import {DelonACLModule} from '@delon/acl';
import {AlainThemeModule} from '@delon/theme';
import {ALAIN_CONFIG, AlainConfig} from '@delon/util/config';
import {ReuseTabModule, ReuseTabService, ReuseTabStrategy} from '@delon/abc/reuse-tab';
import {throwIfAlreadyLoaded} from '@core';
import {environment} from '@env/environment';
import {GANTT_GLOBAL_CONFIG, GANTT_I18N_LOCALE_TOKEN, zhHansLocale} from '@worktile/gantt';
// #region reuse-tab
/**
 * To enable [route reuse](https://ng-alain.com/components/reuse-tab), you need to:
 * 1. Import the `ReuseTabModule` module in `shared-delon.module.ts`
 * 2. Register `RouteReuseStrategy`
 * 3. Update `src/app/layout/erupt/erupt.component.html` as follows:
 *  ```html
 *  <section class="alain-default__content">
 *    <reuse-tab #reuseTab></reuse-tab>
 *    <router-outlet (activate)="reuseTab.activate($event)"></router-outlet>
 *  </section>
 *  ```
 */
import {RouteReuseStrategy} from '@angular/router';
import {NZ_CONFIG, NzConfig} from 'ng-zorro-antd/core/config';


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

// Explicitly provide ReuseTabService
alainProvides.push(ReuseTabService);
alainProvides.push({
    provide: RouteReuseStrategy,
    useClass: ReuseTabStrategy,
    deps: [ReuseTabService],
} as any);

// #region NG-ZORRO Config
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
