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
import {CubePuzzleFilterControl} from "./view/cube-puzzle-filter-control/cube-puzzle-filter-control";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzColorPickerComponent} from "ng-zorro-antd/color-picker";
import {CubeDrillDetailComponent} from "./view/cube-drill-detail/cube-drill-detail.component";


@NgModule({
    declarations: [
        CubePuzzleDashboardComponent,
        CubePuzzleFilterConfig,
        CubePuzzleFilterControl,
        CubePuzzleReport,
        CubePuzzleReportConfig,
        CubeDrillDetailComponent,
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
        NzEmptyComponent,
        NzColorPickerComponent
    ]
})
export class CubeModule {
}
