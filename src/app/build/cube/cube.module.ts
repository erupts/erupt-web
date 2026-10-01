import {NgModule} from '@angular/core';

// ng-zorro modules
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzCardModule} from 'ng-zorro-antd/card';
import {SharedModule} from "@shared/shared.module";
import {CommonModule} from "@angular/common";
import {CubeRoutingModule} from "./cube-routing.module";
import {CubePuzzleDashboardComponent} from './view/cube-puzzle-dashboard/cube-puzzle-dashboard.component';
import {AiChatComponent} from "../ai/view/ai-chat/ai-chat.component";
import {CubePuzzleReportConfig} from './view/cube-puzzle-report-config/cube-puzzle-report-config';
import {Gridster, GridsterItem} from "angular-gridster2";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {CubeReportModule} from "./cube-report.module";
import {CubePuzzleFilterConfig} from "./view/cube-puzzle-filter-config/cube-puzzle-filter-config";
import {CubePuzzleFilterControl} from "./view/cube-puzzle-filter-control/cube-puzzle-filter-control";
import {CubePuzzleDashboardConfig} from "./view/cube-puzzle-dashboard-config/cube-puzzle-dashboard-config";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzColorPickerComponent} from "ng-zorro-antd/color-picker";
import {CubePuzzleDashboardView} from "./view/cube-puzzle-dashboard-view/cube-puzzle-dashboard-view";
import {CubePuzzleSubModelConfig} from "./view/cube-puzzle-sub-model-config/cube-puzzle-sub-model-config";


@NgModule({
    declarations: [
        CubePuzzleDashboardView,
        CubePuzzleDashboardComponent,
        CubePuzzleFilterConfig,
        CubePuzzleFilterControl,
        CubePuzzleReportConfig,
        CubePuzzleDashboardConfig,
        CubePuzzleSubModelConfig,
    ],
    exports: [
        CubePuzzleDashboardComponent
    ],
    imports: [
        CubeReportModule,
        SharedModule,
        CubeRoutingModule,
        CommonModule,
        Gridster,
        GridsterItem,
        NzCardModule,
        NzIconModule,
        NzTooltipDirective,
        NzEmptyComponent,
        NzColorPickerComponent,
        AiChatComponent
    ]
})
export class CubeModule {
}
