import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataService} from "./service/data.service";
import {HttpClientModule} from "@angular/common/http";
import {EditTypeComponent} from './edit-type/edit-type.component';
import {FormsModule} from "@angular/forms";

import {SharedModule} from "../shared/shared.module";
import {SimplemdeModule} from "ngx-simplemde";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        HttpClientModule,
        SimplemdeModule
        // SimplemdeModule.forRoot({
        //     autosave: { enabled: true, uniqueId: 'MyUniqueID' }
        // }),
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
