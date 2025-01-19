import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {TplComponent} from './tpl.component';
import {TplRoutingModule} from "./tpl-routing.module";
import {SharedModule} from "@shared/shared.module";


@NgModule({
    declarations: [TplComponent],
    imports: [
        CommonModule,
        TplRoutingModule,
        SharedModule,
    ]
})
export class TplModule {

    constructor() {

    }
}
