import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {ShareLandingComponent} from "./view/share-landing/share-landing.component";
import {ShareFormComponent} from "./view/share-form/share-form.component";
import {SharePageComponent} from "./view/share-page/share-page.component";

// /share/:code is the link itself; /share/form/:erupt and /share/page/<tpl path> render its target
const routes: Routes = [
    {path: "form/:erupt", component: ShareFormComponent},
    {path: "page", children: [{path: "**", component: SharePageComponent}]},
    {path: ":code", component: ShareLandingComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ShareRoutingModule {
}
