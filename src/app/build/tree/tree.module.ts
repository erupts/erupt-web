import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TreeRoutingModule } from './tree-routing.module';
import { TreeComponent } from './tree/tree.component';
import {SharedModule} from "@shared/shared.module";
import {EruptModule} from "../../erupt/erupt.module";

const COMPONENTS = [TreeComponent];
const COMPONENTS_NOROUNT = [];

@NgModule({
  imports: [
    CommonModule,
    TreeRoutingModule,
    SharedModule,
    EruptModule,
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT,
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class TreeModule { }
