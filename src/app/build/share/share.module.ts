import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NzResultModule} from "ng-zorro-antd/result";
import {SharedModule} from "@shared/shared.module";
import {EruptModule} from "../erupt/erupt.module";
import {ShareRoutingModule} from "./share-routing.module";
import {ShareLandingComponent} from "./view/share-landing/share-landing.component";
import {ShareFormComponent} from "./view/share-form/share-form.component";
import {SharePageComponent} from "./view/share-page/share-page.component";

// Visitor side of erupt-share: the landing page of a link and the public form it may open.
// The share routes come before EruptModule's own (table/:name, form/:name, ...), which the
// import drags in under /share as well: /share/form/<erupt> must reach the share form, not the
// model page behind the scope guard.
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NzResultModule,
        ShareRoutingModule,
        EruptModule
    ],
    declarations: [
        ShareLandingComponent,
        ShareFormComponent,
        SharePageComponent
    ]
})
export class ShareModule {
}
