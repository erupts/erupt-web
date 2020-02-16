import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TableComponent} from "./view/table/table.component";
import {TreeComponent} from "./view/tree/tree.component";


const routes: Routes = [
    {path: "table/:name", component: TableComponent},
    {path: "tree/:name", component: TreeComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EruptRoutingModule {
}
