import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TreeComponent} from "./view/tree/tree.component";
import {TableViewComponent} from "./components/table-view/table-view.component";


const routes: Routes = [
    {path: "table/:name", component: TableViewComponent},
    {path: "tree/:name", component: TreeComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EruptRoutingModule {
}
