import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataService } from "./service/data.service";
import { HttpClientModule } from "@angular/common/http";
import { EditTypeComponent } from "./edit-type/edit-type.component";

import { SharedModule } from "../shared/shared.module";
import { TreeSelectComponent } from "./tree-select/tree-select.component";
import { DataHandlerService } from "./service/data-handler.service";
import { CkeditorComponent } from "./components/ckeditor/ckeditor.component";
import { TabTableComponent } from "./tab-table/tab-table.component";
import { CarouselImgComponent } from "./components/carousel-img/carousel-img.component";
import { QrComponent } from "./components/qr/qr.component";
import { SafeUrlPipe } from "./pipe/safe-url.pipe";
import { AmapComponent } from "./components/amap/amap.component";
import { ExcelImportComponent } from "./components/excel-import/excel-import.component";

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
    TabTableComponent,
    CarouselImgComponent,
    SafeUrlPipe
  ],
  entryComponents: [
    EditTypeComponent,
    TreeSelectComponent,
    CarouselImgComponent,
    QrComponent,
    ExcelImportComponent
  ],
  declarations: [EditTypeComponent, TreeSelectComponent, CkeditorComponent, TabTableComponent, CarouselImgComponent, QrComponent, SafeUrlPipe, AmapComponent, ExcelImportComponent]
})
export class EruptModule {
}
