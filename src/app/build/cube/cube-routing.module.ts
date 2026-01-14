import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CubePuzzleComponent} from "./view/cube-puzzle/cube-puzzle.component";

const routes: Routes = [
    {
        path: "puzzle/:code",
        component: CubePuzzleComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CubeRoutingModule {
}
