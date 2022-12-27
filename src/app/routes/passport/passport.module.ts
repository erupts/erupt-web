import { NgModule } from '@angular/core';

import { UserLoginComponent } from './login/login.component';
import { PassportRoutingModule } from './passport-routing.module';
import {SharedModule} from "@shared/shared.module";

const COMPONENTS = [UserLoginComponent];

@NgModule({
  imports: [SharedModule, PassportRoutingModule],
  declarations: [...COMPONENTS]
})
export class PassportModule {}
