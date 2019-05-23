import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataService } from "./service/data.service";
import { HttpClientModule } from "@angular/common/http";
import { EditTypeComponent } from "./edit-type/edit-type.component";

import { SharedModule } from "../shared/shared.module";
import { TreeSelectComponent } from "./tree-select/tree-select.component";
import { DataHandlerService } from "./service/data-handler.service";
import { CkeditorComponent } from "./components/ckeditor/ckeditor.component";
import { AppConstService } from "./service/app-const.service";
import { TabTableComponent } from "./tab-table/tab-table.component";
import { CarouselImgComponent } from "./components/carousel-img/carousel-img.component";
import { QrComponent } from "./components/qr/qr.component";
import { SafeUrlPipe } from "./pipe/safe-url.pipe";
import { AmapComponent } from './components/amap/amap.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [
    DataService,
    DataHandlerService,
    AppConstService
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
    QrComponent
  ],
  declarations: [EditTypeComponent, TreeSelectComponent, CkeditorComponent, TabTableComponent, CarouselImgComponent, QrComponent,SafeUrlPipe, AmapComponent]
})
export class EruptModule {
}
