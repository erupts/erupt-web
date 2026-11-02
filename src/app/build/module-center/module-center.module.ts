import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '@shared/shared.module';
import {ModuleCenterRoutingModule} from './module-center-routing.module';
import {ModuleCenterComponent} from './view/module-center/module-center.component';

@NgModule({
    declarations: [ModuleCenterComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        ModuleCenterRoutingModule
    ]
})
export class ModuleCenterModule {
}
