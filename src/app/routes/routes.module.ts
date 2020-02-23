import {NgModule} from "@angular/core";

import {SharedModule} from "@shared/shared.module";
import {RouteRoutingModule} from "./routes-routing.module";
// passport pages
import {UserLoginComponent} from "./passport/login/login.component";
import {UserRegisterComponent} from "./passport/register/register.component";
import {UserRegisterResultComponent} from "./passport/register-result/register-result.component";
// single pages
import {UserLockComponent} from "./passport/lock/lock.component";
import {Exception403Component} from "./exception/403.component";
import {Exception404Component} from "./exception/404.component";
import {Exception500Component} from "./exception/500.component";
import {ChangePwdComponent} from "./change-pwd/change-pwd.component";
import {HomeComponent} from './home/home.component';
import {SiteComponent} from "./site/site.component";


const COMPONENTS = [
    // passport pages
    UserLoginComponent,
    UserRegisterComponent,
    UserRegisterResultComponent,
    // single pages
    UserLockComponent,
    Exception403Component,
    Exception404Component,
    Exception500Component,
    ChangePwdComponent,
    SiteComponent
];
const COMPONENTS_NOROUNT = [];

@NgModule({
    imports: [SharedModule, RouteRoutingModule],
    declarations: [
        ...COMPONENTS,
        ...COMPONENTS_NOROUNT,
        HomeComponent
    ],
    entryComponents: COMPONENTS_NOROUNT
})
export class RoutesModule {
}
