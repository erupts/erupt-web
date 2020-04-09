import { APP_INITIALIZER, LOCALE_ID, NgModule } from "@angular/core";
// #region Http Interceptors
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
// #region default language
// 参考：https://ng-alain.com/docs/i18n
import { default as ngLang } from "@angular/common/locales/zh";
import { NZ_I18N, zh_CN as zorroLang } from "ng-zorro-antd";
import { DELON_LOCALE, zh_CN as delonLang } from "@delon/theme";
// register angular
import { DatePipe, registerLocaleData } from "@angular/common";
import { SimpleInterceptor } from "@delon/auth";
import { DefaultInterceptor } from "@core/net/default.interceptor";
// #region Startup Service
import { StartupService } from "@core/startup/startup.service";
import { DelonModule } from "./delon.module";
import { CoreModule } from "./core/core.module";
import { SharedModule } from "./shared/shared.module";
import { AppComponent } from "./app.component";
import { RoutesModule } from "./routes/routes.module";
import { LayoutModule } from "./layout/layout.module";
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

const LANG = {
  abbr: "zh",
  ng: ngLang,
  zorro: zorroLang,
  delon: delonLang
};

registerLocaleData(LANG.ng);
const LANG_PROVIDES = [
  { provide: LOCALE_ID, useValue: LANG.abbr },
  { provide: NZ_I18N, useValue: LANG.zorro },
  { provide: DELON_LOCALE, useValue: LANG.delon }
];
// #endregion

const INTERCEPTOR_PROVIDES = [
  { provide: HTTP_INTERCEPTORS, useClass: SimpleInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: DefaultInterceptor, multi: true }
];
// #endregion

// #region global third module
const GLOBAL_THIRD_MODULES = [];
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
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    DelonModule.forRoot(),
    CoreModule,
    SharedModule,
    LayoutModule,
    RoutesModule,
    ...GLOBAL_THIRD_MODULES,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    ...LANG_PROVIDES,
    ...INTERCEPTOR_PROVIDES,
    ...APP_INIT_PROVIDES
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
