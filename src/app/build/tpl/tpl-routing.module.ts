import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TplComponent} from "./tpl.component";


const routes: Routes = [{
    path: "",
    component: TplComponent,
    data: {
        desc: "tpl",
        status: true
    }
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TplRoutingModule {

}
