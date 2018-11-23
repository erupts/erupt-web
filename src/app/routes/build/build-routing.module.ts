import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TableComponent} from "./table/table.component";
import {TreeViewComponent} from "./tree-view/tree-view.component";

const routes: Routes = [
  {
    path: 'tree',
    component: TreeViewComponent,
    data: {
      title: 'Erupt tree',
      icon: 'icon-tree',
      caption: 'tree tree tree',
      status: true
    }
  },
  {
    path: 'table',
    component: TableComponent,
    data: {
      title: 'Erupt list',
      icon: 'icon-table',
      caption: 'table',
      status: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildRoutingModule {
}
