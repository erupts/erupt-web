import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {BiRoutingModule} from './bi-routing.module';
import {BiComponent} from './bi/bi.component';
import {SharedModule} from "@shared/shared.module";
import {EruptModule} from "../../erupt/erupt.module";
import { DimensionComponent } from './dimension/dimension.component';
import {NgxEchartsModule} from "ngx-echarts";
// import "echarts/dist/echarts.min.js"

@NgModule({
  declarations: [BiComponent, DimensionComponent],
  imports: [
    NgxEchartsModule,
    CommonModule,
    BiRoutingModule,
    SharedModule,
    EruptModule
  ]
})
export class BiModule { }
