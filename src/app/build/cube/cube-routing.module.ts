import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CubeManagementComponent} from "./view/cube-management/cube-management.component";

const routes: Routes = [
    {
        path: "/puzzle/management",
        component: CubeManagementComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CubeRoutingModule {
}
