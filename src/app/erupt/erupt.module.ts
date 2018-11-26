import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataService} from "./service/data.service";
import {HttpClientModule} from "@angular/common/http";
import {EditTypeComponent} from './edit-type/edit-type.component';
import {FormsModule} from "@angular/forms";

import {SharedModule} from "../shared/shared.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        HttpClientModule,
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
