import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PreloadOptionalModules} from '@delon/theme';
import {environment} from '@env/environment';
import {LayoutPassportComponent} from "../layout/passport/passport.component";
import {UserLoginComponent} from "../layout/passport/login/login.component";
import {Exception403Component} from "./exception/403.component";
import {Exception500Component} from "./exception/500.component";
import {Exception404Component} from "./exception/404.component";
import {HomeComponent} from "./home/home.component";
import {FillComponent} from "./fill/fill.component";
import {SiteComponent} from "./site/site.component";
import {LayoutEruptComponent} from "../layout/erupt/erupt.component";
import {UserTenantLoginComponent} from "../layout/passport/tenant-login/tenant-login.component";

let tplLoad = import( "../build/tpl/tpl.module");

// layout
let coreRouter: Routes = [
    {path: "", component: HomeComponent, data: {title: "首页"}},
    {path: "exception", loadChildren: () => import( "./exception/exception.module").then(m => m.ExceptionModule)},
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
        pathMatch: "full",
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'tpl/:name/:name2',
        pathMatch: "full",
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'tpl/:name/:name2/:name3',
        pathMatch: "full",
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'tpl/:name/:name2/:name3/:name4',
        pathMatch: "full",
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'tpl/:name/:name2/:name3/:name4/:name5',
        pathMatch: "full",
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },

    {
        path: "mtpl/:name",
        pathMatch: "full",
        data: {
            micro: true
        },
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'mtpl/:name/:name2',
        pathMatch: "full",
        data: {
            micro: true
        },
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'mtpl/:name/:name2/:name3',
        pathMatch: "full",
        data: {
            micro: true
        },
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'mtpl/:name/:name2/:name3/:name4',
        pathMatch: "full",
        data: {
            micro: true
        },
        loadChildren: () => tplLoad.then(m => m.TplModule)
    },
    {
        path: 'mtpl/:name/:name2/:name3/:name4/:name5',
        pathMatch: "full",
        data: {
            micro: true
        },
        loadChildren: () => tplLoad.then(m => m.TplModule)
    }
];

const routes: Routes = [
    // erupt
    {
        path: "",
        component: LayoutEruptComponent,
        children: coreRouter
    },
    // passport
    {
        path: "passport",
        component: LayoutPassportComponent,
        children: [
            {path: "login", component: UserLoginComponent, data: {title: "Login"}},
            {path: "tenant", component: UserTenantLoginComponent, data: {title: "Login"}},
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
    {path: "403", component: Exception403Component, data: {title: "403"}},
    {path: "404", component: Exception404Component, data: {title: "404"}},
    {path: "500", component: Exception500Component, data: {title: "500"}},
    {path: "**", redirectTo: ""}
];

@NgModule({
    providers: [PreloadOptionalModules],
    imports: [
        RouterModule.forRoot(routes, {
            useHash: environment.useHash,
            // NOTICE: If you use `reuse-tab` component and turn on keepingScroll you can set to `disabled`
            // Pls refer to https://ng-alain.com/components/reuse-tab
            scrollPositionRestoration: 'top',
            preloadingStrategy: PreloadOptionalModules
        })
    ],
    exports: [RouterModule]
})
export class RouteRoutingModule {
}
