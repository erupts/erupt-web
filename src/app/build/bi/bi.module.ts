import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {BiRoutingModule} from './bi-routing.module';
import {BiComponent} from './bi/bi.component';
import {SharedModule} from "@shared/shared.module";
import {DimensionComponent} from './dimension/dimension.component';
import {ReferenceComponent} from "./components/reference.component";
import {BiDataService} from "./service/data.service";
import { ChartComponent } from './chart/chart.component';

@NgModule({
    declarations: [BiComponent, DimensionComponent, ReferenceComponent, ChartComponent],
    imports: [
        CommonModule,
        BiRoutingModule,
        SharedModule
    ],
    providers: [
        BiDataService
    ],
    entryComponents: [
        ReferenceComponent
    ]
})
export class BiModule {
}
