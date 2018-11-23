import {NgModule} from '@angular/core';
import {SharedModule} from '@shared/shared.module';
import {EruptModule} from "../../erupt/erupt.module";
import {BuildRoutingModule} from "./build-routing.module";
import {TreeViewComponent} from "./tree-view/tree-view.component";
import {TableComponent} from "./table/table.component";
import {EditComponent} from "./edit/edit.component";

const COMPONENTS = [EditComponent, TableComponent];
const COMPONENTS_NOROUNT = [EditComponent];

@NgModule({
  imports: [
    SharedModule,
    EruptModule,
    BuildRoutingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT,
    TreeViewComponent
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class BuildModule {
}
