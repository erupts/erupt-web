import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {TreeComponent} from "./tree/tree.component";

const routes: Routes = [
  {
    path: '',
    component: TreeComponent,
    data: {
      title: 'Erupt tree',
      icon: 'icon-tree',
      caption: 'tree tree tree',
      status: true
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TreeRoutingModule { }
