import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {BiRoutingModule} from './bi-routing.module';
import {BiComponent} from './bi/bi.component';
import {SharedModule} from "@shared/shared.module";
import {DimensionComponent} from './dimension/dimension.component';
import {BiDataService} from "./service/data.service";
import {ChartComponent} from './chart/chart.component';
import {ChoiceComponent} from './components/choice/choice.component';
import {ReferenceComponent} from "./components/reference/reference.component";
import {CascadeComponent} from './components/cascade/cascade.component';
import { ChartTableComponent } from './chart-table/chart-table.component';
import { DrillComponent } from './drill/drill.component';
import {NzResultModule} from "ng-zorro-antd/result";
import {NzEmptyModule} from "ng-zorro-antd/empty";
import {SGModule} from "@delon/abc/sg";
import {NzStatisticModule} from "ng-zorro-antd/statistic";
import {NzCascaderModule} from "ng-zorro-antd/cascader";

@NgModule({
    declarations: [BiComponent, DimensionComponent, ReferenceComponent, ChartComponent, ChoiceComponent, CascadeComponent, ChartTableComponent, DrillComponent],
    imports: [
        CommonModule,
        BiRoutingModule,
        SharedModule,
        NzResultModule,
        NzEmptyModule,
        SGModule,
        NzStatisticModule,
        NzCascaderModule
    ],
    providers: [
        BiDataService
    ],
    entryComponents: [
        ReferenceComponent,
        DrillComponent
    ]
})
export class BiModule {
}
