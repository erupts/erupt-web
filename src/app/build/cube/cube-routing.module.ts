import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CubePuzzleDashboardComponent} from "./view/cube-puzzle-dashboard/cube-puzzle-dashboard.component";
import {CubePuzzleDashboardView} from "./view/cube-puzzle-dashboard-view/cube-puzzle-dashboard-view";

const routes: Routes = [
    {
        path: "puzzle/:code",
        component: CubePuzzleDashboardComponent,
        // unsaved edits ask before the designer is left
        canDeactivate: [(component: CubePuzzleDashboardComponent) => component.canLeave()],
    },
    {
        path: ":code",
        component: CubePuzzleDashboardView,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CubeRoutingModule {
}
