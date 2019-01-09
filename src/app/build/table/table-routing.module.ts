import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { TableComponent } from "./table/table.component";

const routes: Routes = [
  {
    path: "",
    component: TableComponent,
    data: {
      desc: "TABLE VIEW",
      status: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TableRoutingModule {
}
