/* eslint-disable import/order */
/* eslint-disable import/no-duplicates */
import {HttpClientModule} from '@angular/common/http';
import {default as ngLang} from '@angular/common/locales/zh';
import {APP_INITIALIZER, LOCALE_ID, NgModule, Type} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SimpleInterceptor} from '@delon/auth';
import {DELON_LOCALE, zh_CN as delonLang, ALAIN_I18N_TOKEN} from '@delon/theme';
import {NZ_DATE_LOCALE, NZ_I18N, zh_CN as zorroLang} from 'ng-zorro-antd/i18n';
import {NzNotificationModule} from 'ng-zorro-antd/notification';

// #region default language
// 参考：https://ng-alain.com/docs/i18n
import {I18NService} from '@core';
import {zhCN as dateLang} from 'date-fns/locale';

const LANG = {
    abbr: 'zh',
    ng: ngLang,
    zorro: zorroLang,
    date: dateLang,
    delon: delonLang
};
// register angular
import {registerLocaleData} from '@angular/common';

registerLocaleData(LANG.ng, LANG.abbr);
const LANG_PROVIDES = [
    {provide: LOCALE_ID, useValue: LANG.abbr},
    {provide: NZ_I18N, useValue: LANG.zorro},
    {provide: NZ_DATE_LOCALE, useValue: LANG.date},
    {provide: DELON_LOCALE, useValue: LANG.delon}
];
// #endregion

// #region i18n services

const I18NSERVICE_PROVIDES = [{provide: ALAIN_I18N_TOKEN, useClass: I18NService, multi: false}];

// #endregion

// #region global third module

import {BidiModule} from '@angular/cdk/bidi';

const GLOBAL_THIRD_MODULES: Array<Type<any>> = [BidiModule];

// #endregion

// #endregion

// #region Http Interceptors
import {HTTP_INTERCEPTORS} from '@angular/common/http';

import {DefaultInterceptor} from '@core';

const INTERCEPTOR_PROVIDES = [
    {provide: HTTP_INTERCEPTORS, useClass: SimpleInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: DefaultInterceptor, multi: true}
];
// #endregion

// #region Startup Service
import {StartupService} from '@core';

export function StartupServiceFactory(startupService: StartupService): () => Observable<void> {
    return () => startupService.load();
}

const APP_INIT_PROVIDES = [
    StartupService,
    {
        provide: APP_INITIALIZER,
        useFactory: StartupServiceFactory,
        deps: [StartupService],
        multi: true
    }
];
// #endregion

import {AppComponent} from './app.component';
import {CoreModule} from './core/core.module';
import {GlobalConfigModule} from './global-config.module';
import {LayoutModule} from './layout/layout.module';
import {RoutesModule} from './routes/routes.module';
import {SharedModule} from './shared/shared.module';
import {Observable} from 'rxjs';
import {AppRoutingModule} from "./app-routing.module";

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        GlobalConfigModule.forRoot(),
        CoreModule,
        SharedModule,
        LayoutModule,
        RoutesModule,
        NzNotificationModule,
        ...GLOBAL_THIRD_MODULES,
        AppRoutingModule
    ],
    providers: [...LANG_PROVIDES, ...INTERCEPTOR_PROVIDES, ...I18NSERVICE_PROVIDES, ...APP_INIT_PROVIDES],
    bootstrap: [AppComponent]
})
export class AppModule {
}
