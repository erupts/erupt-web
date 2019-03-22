import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataService } from "./service/data.service";
import { HttpClientModule } from "@angular/common/http";
import { EditTypeComponent } from "./edit-type/edit-type.component";

import { SharedModule } from "../shared/shared.module";
import { ListSelectComponent } from "./list-select/list-select.component";
import { HelperService } from "./service/helper.service";
import { DataHandlerService } from "./service/data-handler.service";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [
    DataService,
    HelperService,
    DataHandlerService
  ],
  exports: [
    EditTypeComponent
  ],
  entryComponents: [
    EditTypeComponent,
    ListSelectComponent
  ],
  declarations: [EditTypeComponent, ListSelectComponent]
})
export class EruptModule {
}
