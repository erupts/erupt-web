import {NgModule} from '@angular/core';
import {CommonModule} from "@angular/common";
import {NzIconService} from "ng-zorro-antd/icon";
import {NzRateModule} from "ng-zorro-antd/rate";
import {
    BgColorsOutline,
    CalendarOutline,
    CheckCircleOutline,
    CheckSquareOutline,
    CloudUploadOutline,
    CodeOutline,
    DownCircleOutline,
    DragOutline,
    EditOutline,
    EnvironmentOutline,
    FieldNumberOutline,
    FontSizeOutline,
    HighlightOutline,
    LayoutOutline,
    LineOutline,
    ReadOutline,
    SelectOutline,
    SlidersOutline,
    StarOutline,
    TagsOutline,
    UploadOutline
} from "@ant-design/icons-angular/icons";
import {SharedModule} from "@shared/shared.module";
import {EruptModule} from "../erupt/erupt.module";
import {DesignerRoutingModule} from "./designer-routing.module";
import {DesignerComponent} from "./designer.component";
import {DesignerService} from "./service/designer.service";

@NgModule({
    declarations: [
        DesignerComponent
    ],
    providers: [
        DesignerService
    ],
    imports: [
        CommonModule,
        SharedModule,
        EruptModule,
        NzRateModule,
        DesignerRoutingModule
    ]
})
export class DesignerModule {

    // 懒加载模块内自注册设计器所需图标，不增加首屏体积
    constructor(iconService: NzIconService) {
        iconService.addIcon(BgColorsOutline, CalendarOutline, CheckCircleOutline, CheckSquareOutline,
            CloudUploadOutline, CodeOutline, DownCircleOutline, DragOutline, EditOutline, EnvironmentOutline,
            FieldNumberOutline, FontSizeOutline, HighlightOutline, LayoutOutline, LineOutline, ReadOutline,
            SelectOutline, SlidersOutline, StarOutline, TagsOutline, UploadOutline);
    }

}
