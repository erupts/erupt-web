import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ExceptionModule as DelonExceptionModule} from '@delon/abc/exception';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzCardModule} from 'ng-zorro-antd/card';

import {ExceptionRoutingModule} from './exception-routing.module';
import {Exception403Component} from "./403.component";
import {Exception404Component} from "./404.component";
import {Exception500Component} from "./500.component";

@NgModule({
  imports: [CommonModule, DelonExceptionModule, NzButtonModule, NzCardModule, ExceptionRoutingModule],
  declarations: [Exception403Component, Exception404Component, Exception500Component]
})
export class ExceptionModule {
}
