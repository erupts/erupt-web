import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SkeletonComponent} from "./skeleton/skeleton.component";

const routes: Routes = [
  {
    path: "",
    component: SkeletonComponent,
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
