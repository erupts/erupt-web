import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {LayoutPassportComponent} from '../../layout/passport/passport.component';
import {UserLoginComponent} from './login/login.component';

const routes: Routes = [
  // passport
  {
    path: '',
    component: LayoutPassportComponent,
    children: [
      {
        path: '',
        component: UserLoginComponent,
        data: { title: '登录', titleI18n: 'app.login.login' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassportRoutingModule {}
