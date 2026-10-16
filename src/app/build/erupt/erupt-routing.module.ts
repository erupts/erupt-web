import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TreeComponent} from "./view/tree/tree.component";
import {TableViewComponent} from "./view/table-view/table-view.component";
import {FormViewComponent} from "./view/form-view/form-view.component";
import {ScopeGateComponent} from "./view/scope-gate/scope-gate.component";
import {scopeGuard} from "./view/scope-gate/scope.guard";


const routes: Routes = [
    {path: "table/:name", component: TableViewComponent, canActivate: [scopeGuard]},
    {path: "tree/:name", component: TreeComponent, canActivate: [scopeGuard]},
    {path: "form/:name", component: FormViewComponent, canActivate: [scopeGuard]},
    // stands in for a model page whose scope has no pick yet; never kept as a reuse tab
    {path: "scope/:scope", component: ScopeGateComponent, data: {reuse: false}}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EruptRoutingModule {
}
