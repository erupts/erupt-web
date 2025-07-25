import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FlowComponent} from "./view/flow/flow.component";

const routes: Routes = [
  {
    path: "",
    component: FlowComponent,
    data: {
      desc: "Flow",
      status: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FlowRoutingModule { }
