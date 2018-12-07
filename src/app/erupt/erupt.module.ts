import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataService} from "./service/data.service";
import {HttpClientModule} from "@angular/common/http";
import {EditTypeComponent} from './edit-type/edit-type.component';

import {SharedModule} from "../shared/shared.module";
import {SimplemdeModule} from "ngx-simplemde";
import { ListSelectComponent } from './list-select/list-select.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        HttpClientModule,
        SimplemdeModule.forRoot({}),
    ],
    providers: [
        DataService,
    ],
    exports: [
        EditTypeComponent
    ],
    entryComponents: [
        EditTypeComponent
    ],
    declarations: [EditTypeComponent, ListSelectComponent]
})
export class EruptModule {
}
