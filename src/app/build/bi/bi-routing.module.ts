import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BiComponent} from "./bi/bi.component";

const routes: Routes = [
  {
    path: "",
    component: BiComponent,
    data: {
      desc: "BI",
      status: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BiRoutingModule { }
