import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TreeComponent} from "./view/tree/tree.component";
import {TableViewComponent} from "./view/table-view/table-view.component";
import {FormViewComponent} from "./view/form-view/form-view.component";


const routes: Routes = [
    {path: "table/:name", component: TableViewComponent},
    {path: "tree/:name", component: TreeComponent},
    {path: "form/:name", component: FormViewComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EruptRoutingModule {
}
