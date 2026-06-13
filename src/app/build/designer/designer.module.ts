import {NgModule} from '@angular/core';
import {CommonModule} from "@angular/common";
import {NzBadgeModule} from "ng-zorro-antd/badge";
import {NzCodeEditorModule} from "ng-zorro-antd/code-editor";
import {NzIconService} from "ng-zorro-antd/icon";
import {NzRateModule} from "ng-zorro-antd/rate";
import {
    AppstoreOutline,
    BarChartOutline,
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
    ProjectOutline,
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
        NzBadgeModule,
        NzCodeEditorModule,
        DesignerRoutingModule
    ]
})
export class DesignerModule {

    // 懒加载模块内自注册设计器所需图标，不增加首屏体积
    constructor(iconService: NzIconService) {
        iconService.addIcon(AppstoreOutline, BarChartOutline, BgColorsOutline, CalendarOutline, CheckCircleOutline,
            CheckSquareOutline, CloudUploadOutline, CodeOutline, DownCircleOutline, DragOutline, EditOutline,
            EnvironmentOutline, FieldNumberOutline, FontSizeOutline, HighlightOutline, LayoutOutline, LineOutline,
            ProjectOutline, ReadOutline, SelectOutline, SlidersOutline, StarOutline, TagsOutline, UploadOutline);
    }

}
