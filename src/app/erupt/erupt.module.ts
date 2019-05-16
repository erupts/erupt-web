import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataService } from "./service/data.service";
import { HttpClientModule } from "@angular/common/http";
import { EditTypeComponent } from "./edit-type/edit-type.component";

import { SharedModule } from "../shared/shared.module";
import { TreeSelectComponent } from "./tree-select/tree-select.component";
import { DataHandlerService } from "./service/data-handler.service";
import { CkeditorComponent } from "./ckeditor/ckeditor.component";
import { AppConstService } from "./service/app-const.service";
import { TabTableComponent } from "./tab-table/tab-table.component";
import { CarouselImgComponent } from './components/carousel-img/carousel-img.component';

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
    CarouselImgComponent
  ],
  entryComponents: [
    EditTypeComponent,
    TreeSelectComponent,
    CarouselImgComponent
  ],
  declarations: [EditTypeComponent, TreeSelectComponent, CkeditorComponent, TabTableComponent, CarouselImgComponent]
})
export class EruptModule {
}
