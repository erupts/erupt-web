import {NgModule} from '@angular/core';
import {CommonModule} from "@angular/common";
import {SharedModule} from "@shared/shared.module";
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {CubeApiService} from "./service/cube-api.service";
import {CubePuzzleReport} from "./view/cube-puzzle-report/cube-puzzle-report";
import {CubeDrillDetailComponent} from "./view/cube-drill-detail/cube-drill-detail.component";
import {CubeVisComponent} from "./view/cube-vis/cube-vis.component";

/**
 * The chart renderer, its drill-down and the @Vis CUBE view built on them, without the
 * dashboard shell or routing, so erupt's table can embed charts next to its other views.
 */
@NgModule({
    declarations: [
        CubePuzzleReport,
        CubeDrillDetailComponent,
        CubeVisComponent,
    ],
    providers: [
        CubeApiService
    ],
    exports: [
        CubePuzzleReport,
        CubeVisComponent
    ],
    imports: [
        SharedModule,
        CommonModule,
        NzCardModule,
        NzIconModule,
        NzTooltipDirective,
        NzEmptyComponent,
    ]
})
export class CubeReportModule {
}
