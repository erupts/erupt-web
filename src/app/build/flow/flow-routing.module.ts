import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FlowManagementComponent} from "@flow/view/flow-management/flow-management.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "management",
    pathMatch: "full"
  },
  {
    path: "management",
    component: FlowManagementComponent,
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
