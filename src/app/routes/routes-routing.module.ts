import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {environment} from "@env/environment";
// layout
import {LayoutDefaultComponent} from "../layout/default/default.component";
import {LayoutPassportComponent} from "../layout/passport/passport.component";
// passport pages
import {UserLoginComponent} from "./passport/login/login.component";
// single pages
import {Exception403Component} from "./exception/403.component";
import {Exception404Component} from "./exception/404.component";
import {Exception500Component} from "./exception/500.component";
import {HomeComponent} from "./home/home.component";
import {SiteComponent} from "./site/site.component";
import {FillComponent} from "./fill/fill.component";

let coreRouter: Routes = [
    {path: "", component: HomeComponent, data: {titleI18n: "global.home"}},
    {path: "layout/403", component: Exception403Component, data: {title: "403"}},
    {path: "layout/404", component: Exception404Component, data: {title: "404"}},
    {path: "layout/500", component: Exception500Component, data: {title: "500"}},
    {path: "site/:url", component: SiteComponent},
    {
        path: "build",
        loadChildren: () => import('../build/erupt/erupt.module').then(m => m.EruptModule),
    },
    {
        path: "bi/:name",
        loadChildren: () => import( "../build/bi/bi.module").then(m => m.BiModule),
        pathMatch: "full"
    },
    {
        path: "tpl/:name",
        loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule),
        pathMatch: "full"
    }
];

const routes: Routes = [
    // default
    {
        path: "",
        component: LayoutDefaultComponent,
        children: coreRouter
    },
    // passport
    {
        path: "passport",
        component: LayoutPassportComponent,
        children: [
            {path: "login", component: UserLoginComponent},
        ]
    },
    // 全屏布局
    {
        path: "fill",
        component: FillComponent,
        children: coreRouter
    },
    // 单页不包裹Layout
    // {path: "lock", component: UserLockComponent, data: {title: "锁屏", titleI18n: "lock"}},
    {path: "403", component: Exception403Component},
    {path: "404", component: Exception404Component},
    {path: "500", component: Exception500Component},
    {path: "**", redirectTo: ""}
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: environment.useHash, onSameUrlNavigation: 'reload'})],
    exports: [RouterModule]
})
export class RouteRoutingModule {
}
