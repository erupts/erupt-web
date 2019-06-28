import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataService } from "./service/data.service";
import { HttpClientModule } from "@angular/common/http";
import { EditTypeComponent } from "./edit-type/edit-type.component";

import { SharedModule } from "../shared/shared.module";
import { TreeSelectComponent } from "./components/tree-select/tree-select.component";
import { DataHandlerService } from "./service/data-handler.service";
import { CkeditorComponent } from "./components/ckeditor/ckeditor.component";
import { TabTableComponent } from "./components/tab-table/tab-table.component";
import { QrComponent } from "./components/qr/qr.component";
import { SafeUrlPipe } from "./pipe/safe-url.pipe";
import { AmapComponent } from "./components/amap/amap.component";
import { ExcelImportComponent } from "./components/excel-import/excel-import.component";
import { ReferenceTableComponent } from "./components/reference-table/reference-table.component";
import { ViewTypeComponent } from "./view-type/view-type.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [
    DataService,
    DataHandlerService
  ],
  exports: [
    EditTypeComponent,
    ViewTypeComponent,
    TabTableComponent,
    SafeUrlPipe
  ],
  entryComponents: [
    EditTypeComponent,
    ViewTypeComponent,
    TreeSelectComponent,
    QrComponent,
    ExcelImportComponent,
    ReferenceTableComponent
  ],
  declarations: [
    EditTypeComponent,
    TreeSelectComponent,
    CkeditorComponent,
    TabTableComponent,
    QrComponent,
    SafeUrlPipe,
    AmapComponent,
    ExcelImportComponent,
    ReferenceTableComponent,
    ViewTypeComponent
  ]
})
export class EruptModule {
}
