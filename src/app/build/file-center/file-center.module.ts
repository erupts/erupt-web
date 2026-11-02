import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '@shared/shared.module';
import {NzResizableModule} from 'ng-zorro-antd/resizable';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {NzPopconfirmModule} from 'ng-zorro-antd/popconfirm';
import {NzTooltipModule} from 'ng-zorro-antd/tooltip';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzInputModule} from 'ng-zorro-antd/input';
import {FileCenterRoutingModule} from './file-center-routing.module';
import {FileCenterComponent} from './view/file-center/file-center.component';

@NgModule({
    declarations: [FileCenterComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NzResizableModule,
        NzSpinModule,
        NzPopconfirmModule,
        NzTooltipModule,
        NzButtonModule,
        NzInputModule,
        FileCenterRoutingModule
    ]
})
export class FileCenterModule {
}
