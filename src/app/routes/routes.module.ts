import {NgModule, Type} from '@angular/core';

import {RouteRoutingModule} from './routes-routing.module';
import {SharedModule} from "@shared/shared.module";
import {SiteComponent} from "./site/site.component";
import {HomeComponent} from "./home/home.component";
import {ChangePwdComponent} from "./change-pwd/change-pwd.component";

const COMPONENTS: Array<Type<any>> = [SiteComponent, HomeComponent, ChangePwdComponent];

@NgModule({
  imports: [SharedModule, RouteRoutingModule],
  declarations: [...COMPONENTS]
})
export class RoutesModule {
}
