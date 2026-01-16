import {NgModule} from '@angular/core';

// ng-zorro模块
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzCardModule} from 'ng-zorro-antd/card';
import {SharedModule} from "@shared/shared.module";
import {CommonModule} from "@angular/common";
import {CubeRoutingModule} from "./cube-routing.module";
import {CubePuzzleComponent} from './view/cube-puzzle/cube-puzzle.component';
import {CubePuzzleReportConfig} from './view/cube-puzzle-report-config/cube-puzzle-report-config';
import {GridsterComponent, GridsterItemComponent} from "angular-gridster2";
import {CubeApiService} from "./service/cube-api.service";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";


@NgModule({
    declarations: [
        CubePuzzleComponent,
        CubePuzzleReportConfig
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
        NzTooltipDirective
    ]
})
export class CubeModule {
}
