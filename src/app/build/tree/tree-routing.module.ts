import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {TreeComponent} from "./tree/tree.component";

const routes: Routes = [
  {
    path: '',
    component: TreeComponent,
    data: {
      caption: 'TREE VIEW',
      status: true
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TreeRoutingModule { }
