import {NgModule} from '@angular/core';

// ng-zorro模块
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzCardModule} from 'ng-zorro-antd/card';
import {SharedModule} from "@shared/shared.module";
import {CommonModule} from "@angular/common";
import {CubeRoutingModule} from "./cube-routing.module";
import {CubePuzzleDashboardComponent} from './view/cube-puzzle-dashboard/cube-puzzle-dashboard.component';
import {CubePuzzleReportConfig} from './view/cube-puzzle-report-config/cube-puzzle-report-config';
import {GridsterComponent, GridsterItemComponent} from "angular-gridster2";
import {CubeApiService} from "./service/cube-api.service";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {CubePuzzleReport} from "./view/cube-puzzle-report/cube-puzzle-report";
import {CubePuzzleFilterConfig} from "./view/cube-puzzle-filter-config/cube-puzzle-filter-config";
import {CubePuzzleFilterComp} from "./view/cube-puzzle-filter-comp/cube-puzzle-filter-comp";
import {NzEmptyComponent} from "ng-zorro-antd/empty";


@NgModule({
    declarations: [
        CubePuzzleDashboardComponent,
        CubePuzzleFilterConfig,
        CubePuzzleFilterComp,
        CubePuzzleReport,
        CubePuzzleReportConfig,
    ],
    providers: [
        CubeApiService
    ],
    imports: [
        SharedModule,
        CubeRoutingModule,
        CommonModule,
        GridsterComponent,
        GridsterItemComponent,
        NzCardModule,
        NzIconModule,
        NzTooltipDirective,
        NzEmptyComponent
    ]
})
export class CubeModule {
}
