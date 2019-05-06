import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataService } from "./service/data.service";
import { HttpClientModule } from "@angular/common/http";
import { EditTypeComponent } from "./edit-type/edit-type.component";

import { SharedModule } from "../shared/shared.module";
import { TreeSelectComponent } from "./tree-select/tree-select.component";
import { HelperService } from "./service/helper.service";
import { DataHandlerService } from "./service/data-handler.service";
import { CkeditorComponent } from "./ckeditor/ckeditor.component";
import { AppConstService } from "./service/app-const.service";
import { TabTableComponent } from "./tab-table/tab-table.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [
    DataService,
    HelperService,
    DataHandlerService,
    AppConstService
  ],
  exports: [
    EditTypeComponent,
    TabTableComponent
  ],
  entryComponents: [
    EditTypeComponent,
    TreeSelectComponent
  ],
  declarations: [EditTypeComponent, TreeSelectComponent, CkeditorComponent, TabTableComponent]
})
export class EruptModule {
}
