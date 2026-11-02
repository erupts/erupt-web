import {Routes} from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {SiteComponent} from "./site/site.component";

// The pages of the admin layout. Mounted under the layout, under /fill, and under /share for the
// menu a public link opens: the frontend renders a menu the same way wherever it is reached from.
let tplLoad = import( "../build/tpl/tpl.module");

// layout
export const coreRouter: Routes = [
    {path: "", component: HomeComponent, data: {title: "Home"}},
    {path: "exception", loadChildren: () => import( "./exception/exception.module").then(m => m.ExceptionModule)},
    {path: "site/:url", component: SiteComponent},
    // Same component, micro-frontend container instead of an iframe. Useful when the
    // target refuses framing (X-Frame-Options) but allows cross-origin fetch.
    {path: "msite/:url", component: SiteComponent, data: {micro: true}},
    {
        path: "flow",
        loadChildren: () => import( "../build/flow/flow.module").then(m => m.FlowModule)
    },
    {
        path: "cube",
        loadChildren: () => import( "../build/cube/cube.module").then(m => m.CubeModule)
    },
    {
        path: "designer",
        loadChildren: () => import( "../build/designer/designer.module").then(m => m.DesignerModule)
    },
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
        path: "ai",
        loadChildren: () => import("../build/ai/ai.module").then(m => m.AiModule)
    },
    {
        path: "monitor",
        loadChildren: () => import("../build/monitor/monitor.module").then(m => m.MonitorModule)
    },
    {
        path: "terminal",
        loadChildren: () => import("../build/terminal/terminal.module").then(m => m.TerminalModule)
    },
    {
        path: "file-center",
        loadChildren: () => import("../build/file-center/file-center.module").then(m => m.FileCenterModule)
    },
    {
        path: "module-center",
        loadChildren: () => import("../build/module-center/module-center.module").then(m => m.ModuleCenterModule)
    },
    {
        path: "ai-dev",
        loadChildren: () => import("../build/ai-dev/ai-dev.module").then(m => m.AiDevModule)
    },
    {
        path: "remote/:id",
        loadChildren: () => import("../build/remote/remote.module").then(m => m.RemoteModule)
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
