import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {BiRoutingModule} from './bi-routing.module';
import {BiComponent} from './bi/bi.component';
import {SharedModule} from "@shared/shared.module";
import {DimensionComponent} from './dimension/dimension.component';
import {NgxEchartsModule} from "ngx-echarts";
import {ReferenceComponent} from "./components/reference.component";

// import "echarts/dist/echarts.min.js"

@NgModule({
    declarations: [BiComponent, DimensionComponent, ReferenceComponent],
    imports: [
        NgxEchartsModule,
        CommonModule,
        BiRoutingModule,
        SharedModule
    ],
    entryComponents:[
        ReferenceComponent
    ]
})
export class BiModule {
}
