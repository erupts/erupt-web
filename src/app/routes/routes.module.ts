import {NgModule} from "@angular/core";

import {SharedModule} from "@shared/shared.module";
import {RouteRoutingModule} from "./routes-routing.module";
// passport pages
import {UserLoginComponent} from "./passport/login/login.component";
// single pages
import {Exception403Component} from "./exception/403.component";
import {Exception404Component} from "./exception/404.component";
import {Exception500Component} from "./exception/500.component";
import {ChangePwdComponent} from "./change-pwd/change-pwd.component";
import {HomeComponent} from './home/home.component';
import {SiteComponent} from "./site/site.component";
import {FillComponent} from './fill/fill.component';


const COMPONENTS = [
    // passport pages
    UserLoginComponent,
    // single pages
    Exception403Component,
    Exception404Component,
    Exception500Component,
    ChangePwdComponent,
    SiteComponent
];
const COMPONENTS_NOROUNT = [
    UserLoginComponent
];

@NgModule({
    imports: [SharedModule, RouteRoutingModule],
    declarations: [
        ...COMPONENTS,
        ...COMPONENTS_NOROUNT,
        HomeComponent,
        FillComponent
    ],
    entryComponents: [COMPONENTS_NOROUNT, ChangePwdComponent]
})
export class RoutesModule {
}
