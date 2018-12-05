import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataService} from "./service/data.service";
import {HttpClientModule} from "@angular/common/http";
import {EditTypeComponent} from './edit-type/edit-type.component';

import {SharedModule} from "../shared/shared.module";
import {SimplemdeModule} from "ngx-simplemde";

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
    declarations: [EditTypeComponent]
})
export class EruptModule {
}
