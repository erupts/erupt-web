import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PreloadOptionalModules} from '@delon/theme';
import {environment} from '@env/environment';
import {coreRouter} from './core.routes';
import {LayoutPassportComponent} from "../layout/passport/passport.component";
import {UserLoginComponent} from "../layout/passport/login/login.component";
import {Exception403Component} from "./exception/403.component";
import {Exception500Component} from "./exception/500.component";
import {Exception404Component} from "./exception/404.component";
import {FillComponent} from "./fill/fill.component";
import {LayoutEruptComponent} from "../layout/erupt/erupt.component";
import {UserTenantLoginComponent} from "../layout/passport/tenant-login/tenant-login.component";

const routes: Routes = [
    // public share links: no layout, no login; the landing page mints its own session
    {
        path: "share",
        loadChildren: () => import("../build/share/share.module").then(m => m.ShareModule)
    },
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
    // Full-screen layout
    {
        path: "fill",
        component: FillComponent,
        children: coreRouter
    },
    // Single page without layout wrapper
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
