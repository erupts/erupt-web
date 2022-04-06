import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {TplComponent} from './tpl.component';
import {TplRoutingModule} from "./tpl-routing.module";
import {SharedModule} from "@shared/shared.module";
import {LazyService} from "@delon/util";


@NgModule({
    declarations: [TplComponent],
    imports: [
        CommonModule,
        TplRoutingModule,
        SharedModule,
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ]
})
export class TplModule {

    constructor(private lazy: LazyService) {
        (window as any).exports = {};
        lazy.loadScript("assets/js/micro-app.min.js").then(() => {
            // 启动micro-app
            (window as any).exports.default.start();
        });
    }
}
