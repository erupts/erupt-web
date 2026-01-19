import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CubePuzzleDashboardComponent} from "./view/cube-puzzle-dashboard/cube-puzzle-dashboard.component";

const routes: Routes = [
    {
        path: "puzzle/:code",
        component: CubePuzzleDashboardComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CubeRoutingModule {
}
