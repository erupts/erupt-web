import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {TableRoutingModule} from './table-routing.module';
import {EditComponent} from "./edit/edit.component";
import {TableComponent} from "./table/table.component";
import {EruptModule} from "../../erupt/erupt.module";
import {SharedModule} from "@shared/shared.module";

const COMPONENTS = [EditComponent, TableComponent];
const COMPONENTS_NOROUNT = [EditComponent];

@NgModule({
    imports: [
        CommonModule,
        TableRoutingModule,
        SharedModule,
        EruptModule,
    ],
    declarations: [
        ...COMPONENTS,
        ...COMPONENTS_NOROUNT,
    ],
    entryComponents: COMPONENTS_NOROUNT
})
export class TableModule {
}
