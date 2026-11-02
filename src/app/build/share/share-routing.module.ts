import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {ShareLandingComponent} from "./view/share-landing/share-landing.component";
import {ShareFormComponent} from "./view/share-form/share-form.component";
import {SharePageComponent} from "./view/share-page/share-page.component";
import {ShareTargetComponent} from "./view/share-target/share-target.component";
import {coreRouter} from "../../routes/core.routes";

// /share/:code is the link itself. A form link renders at /share/form/:erupt, a template page under
// /share/page/ with the share token in its frame, and any other menu at /share + the path the admin
// layout uses for that menu type (the same pages, hosted full screen)
const routes: Routes = [
    {path: "form/:erupt", component: ShareFormComponent},
    {path: "page", children: [{path: "**", component: SharePageComponent}]},
    {path: "", component: ShareTargetComponent, children: coreRouter},
    {path: ":code", component: ShareLandingComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ShareRoutingModule {
}
