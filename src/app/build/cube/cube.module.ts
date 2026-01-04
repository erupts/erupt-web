import {NgModule} from '@angular/core';

// ng-zorro模块
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzCardModule} from 'ng-zorro-antd/card';
import {SharedModule} from "@shared/shared.module";
import {CommonModule} from "@angular/common";
import {CubeRoutingModule} from "./cube-routing.module";
import {CubeManagementComponent} from './view/cube-management/cube-management.component';
import {GridsterComponent, GridsterItemComponent} from "angular-gridster2";


@NgModule({
    declarations: [
        CubeManagementComponent
    ],
    providers: [],
    imports: [
        SharedModule,
        CubeRoutingModule,
        CommonModule,
        GridsterComponent,
        GridsterItemComponent,
        NzCardModule,
        NzIconModule
    ]
})
export class CubeModule {
}
