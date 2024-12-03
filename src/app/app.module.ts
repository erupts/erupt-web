/* eslint-disable import/order */
/* eslint-disable import/no-duplicates */
// #region Http Interceptors
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {APP_INITIALIZER, NgModule, Type} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SimpleInterceptor} from '@delon/auth';
import {NzNotificationModule} from 'ng-zorro-antd/notification';

import {DefaultInterceptor, I18NService, StartupService} from '@core';
// register angular
import {BidiModule} from '@angular/cdk/bidi';
import {AppComponent} from './app.component';
import {CoreModule} from './core/core.module';
import {GlobalConfigModule} from './global-config.module';
import {LayoutModule} from './layout/layout.module';
import {RoutesModule} from './routes/routes.module';
import {SharedModule} from '@shared/shared.module';
import {AppRoutingModule} from "./app-routing.module";
import {AppViewService} from "@shared/service/app-view.service";


// #region global third module

const GLOBAL_THIRD_MODULES: Array<Type<any>> = [BidiModule];

// #endregion

// #endregion

const INTERCEPTOR_PROVIDES = [
    {provide: HTTP_INTERCEPTORS, useClass: SimpleInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: DefaultInterceptor, multi: true}
];

// #endregion

export function StartupServiceFactory(startupService: StartupService): Function {
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

@NgModule({
    declarations: [AppComponent],
    exports: [],
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
    providers: [...INTERCEPTOR_PROVIDES, ...APP_INIT_PROVIDES, I18NService, AppViewService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
