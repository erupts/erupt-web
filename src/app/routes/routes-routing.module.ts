import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PreloadOptionalModules} from '@delon/theme';
import {environment} from '@env/environment';
import {LayoutPassportComponent} from "../layout/passport/passport.component";
import {UserLoginComponent} from "../layout/passport/login/login.component";
import {LayoutDefaultComponent} from "../layout/default/default.component";

// layout

const routes: Routes = [
    {
        path: '',
        component: LayoutDefaultComponent,
        // canActivate: [SimpleGuard],
        // canActivateChild: [SimpleGuard],
        data: {},
        children: [
            // {path: '', component: HomeComponent, data: {titleI18n: "global.home"}},
        ]
    },
    {
        path: 'passport', component: LayoutPassportComponent,
        children: [
            {path: 'login', component: UserLoginComponent, data: {titleI18n: "global.login"}},
        ],
        data: {preload: true}
    },
    // {path: "", component: HomeComponent, data: {titleI18n: "global.home"}},
    // {path: "layout/403", component: Exception403Component, data: {title: "403"}},
    // {path: "layout/404", component: Exception404Component, data: {title: "404"}},
    // {path: "layout/500", component: Exception500Component, data: {title: "500"}},
    // {path: "site/:url", component: SiteComponent},
    {
        path: "build",
        component: LayoutDefaultComponent,
        loadChildren: () => import('../build/erupt/erupt.module').then(m => m.EruptModule),
    },
    // {
    //   path: "bi/:name",
    //   loadChildren: () => import( "../build/bi/bi.module").then(m => m.BiModule),
    //   pathMatch: "full"
    // },
    // {path: "tpl/:name", pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)},
    // {path: 'tpl/:name/:name1', pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)},
    // {path: 'tpl/:name/:name2/:name3', pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)},
    // {path: 'tpl/:name/:name2/:name3/:name4', pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)}
    // {
    //   path: '',
    //   loadChildren: () => import('./passport/passport.module').then(m => m.PassportModule),
    //   data: {preload: true}
    // },
    {path: 'exception', loadChildren: () => import('./exception/exception.module').then(m => m.ExceptionModule)},
    {path: '**', redirectTo: 'exception/404'},

    // {
    //   path: "build",
    //   loadChildren: () => import('../build/erupt/erupt.module').then(m => m.EruptModule),
    // },
    // {
    //   path: "bi/:name",
    //   loadChildren: () => import( "../build/bi/bi.module").then(m => m.BiModule),
    //   pathMatch: "full"
    // // },
    // {path: "tpl/:name", pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)},
    // {path: 'tpl/:name/:name1', pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)},
    // {path: 'tpl/:name/:name2/:name3', pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)},
    // {path: 'tpl/:name/:name2/:name3/:name4', pathMatch: "full", loadChildren: () => import( "../build/tpl/tpl.module").then(m => m.TplModule)}
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
