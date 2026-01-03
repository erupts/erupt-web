import {NgModule} from '@angular/core';

import {RouteRoutingModule} from './routes-routing.module';
import {SharedModule} from "@shared/shared.module";
import {SiteComponent} from "./site/site.component";
import {HomeComponent} from "./home/home.component";
import {UserLoginComponent} from "../layout/passport/login/login.component";
import {LayoutModule} from "../layout/layout.module";
import {FillComponent} from "./fill/fill.component";
import {ResetPwdComponent} from "./reset-pwd/reset-pwd.component";
import {UserTenantLoginComponent} from "../layout/passport/tenant-login/tenant-login.component";


@NgModule({
    imports: [SharedModule, RouteRoutingModule, LayoutModule],
    declarations: [SiteComponent, FillComponent, HomeComponent, ResetPwdComponent, UserLoginComponent, UserTenantLoginComponent]
})
export class RoutesModule {
}
