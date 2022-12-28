import {NgModule, Type} from '@angular/core';

import {RouteRoutingModule} from './routes-routing.module';
import {SharedModule} from "@shared/shared.module";
import {SiteComponent} from "./site/site.component";
import {HomeComponent} from "./home/home.component";
import {ChangePwdComponent} from "./change-pwd/change-pwd.component";
import {UserLoginComponent} from "../layout/passport/login/login.component";
import {LayoutModule} from "../layout/layout.module";
import {TranslateModule} from "@ngx-translate/core";

const COMPONENTS: Array<Type<any>> = [SiteComponent, HomeComponent, ChangePwdComponent,UserLoginComponent];

@NgModule({
    imports: [SharedModule, RouteRoutingModule, LayoutModule, TranslateModule],
  declarations: [...COMPONENTS]
})
export class RoutesModule {
}
