import {Component, ElementRef, Input, OnInit} from "@angular/core";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {AttachmentEnum, ChoiceEnum, DateEnum, EditType, FormSize, MultiChoiceEnum} from "../../model/erupt.enum";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {colRules} from "@shared/model/util.model";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {I18NService} from "@core";
import printJS from "print-js";

@Component({
    standalone: false,
    selector: "erupt-print-type",
    templateUrl: "./print-type.html",
    styleUrls: ["./print-type.less"]
})
export class PrintTypeComponent implements OnInit {

    //important
    @Input() eruptBuildModel: EruptBuildModel;

    //UI
    @Input() col = colRules[3];

    //UI
    @Input() labelWidth: number = 120;

    eruptModel: EruptModel;

    editType = EditType;

    choiceEnum = ChoiceEnum;

    multiChoiceEnum = MultiChoiceEnum;

    attachmentEnum = AttachmentEnum;

    tabErupts: {
        key: string,
        value: EruptBuildModel
    }[] = [];

    constructor(public dataService: DataService, private i18n: I18NService, private elementRef: ElementRef) {
    }

    ngOnInit() {
        this.eruptModel = this.eruptBuildModel.eruptModel;
        let layout = this.eruptModel.eruptJson.layout;
        if (layout && layout.formSize == FormSize.FULL_LINE) {
            this.col = colRules[1];
        }
        for (let model of this.eruptModel.eruptFieldModels) {
            switch (model.eruptFieldJson.edit.type) {
                case EditType.TAB_TABLE_REFER:
                case EditType.TAB_TABLE_ADD:
                case EditType.TAB_TREE:
                    this.tabErupts.push({
                        key: model.fieldName,
                        value: this.eruptBuildModel.tabErupts[model.fieldName]
                    })
                    break;
            }
        }
    }

    // 获取显示值
    getDisplayValue(field: EruptFieldModel): any {
        const edit = field.eruptFieldJson.edit;
        const value = edit.$value;

        if (value === null || value === undefined) {
            return '-';
        }

        switch (edit.type) {
            case EditType.BOOLEAN:
                return value ? edit.boolType.trueText : edit.boolType.falseText;
            case EditType.DATE:
                let format = "yyyy-MM-dd";
                switch (edit.dateType.type) {
                    case DateEnum.DATE:
                        format = "yyyy-MM-dd";
                        break;
                    case DateEnum.DATE_TIME:
                        format = "yyyy-MM-dd HH:mm:ss";
                        break;
                    case DateEnum.MONTH:
                        format = "yyyy-MM";
                        break;
                    case DateEnum.WEEK:
                        format = "yyyy-ww";
                        break;
                    case DateEnum.YEAR:
                        format = "yyyy";
                        break;
                    case DateEnum.TIME:
                        format = "HH:mm:ss";
                }
                return this.i18n.datePipe.transform(value, format);
            case EditType.CHOICE:
                return edit.$viewValue || value;
            case EditType.MULTI_CHOICE:
                if (Array.isArray(edit.$viewValue)) {
                    return edit.$viewValue.join(', ');
                }
                return edit.$viewValue || value;
            case EditType.TAGS:
                if (Array.isArray(value)) {
                    return value.join(', ');
                }
                return value;
            case EditType.REFERENCE_TABLE:
            case EditType.REFERENCE_TREE:
                return edit.$viewValue || value;
            default:
                return value;
        }
    }

    // 判断是否显示附件列表
    hasAttachments(field: EruptFieldModel): boolean {
        const viewValue = field.eruptFieldJson.edit.$viewValue;
        return viewValue && Array.isArray(viewValue) && viewValue.length > 0;
    }

    // 判断是否有签名
    hasSignature(field: EruptFieldModel): boolean {
        return !!field.eruptFieldJson.edit.$value;
    }

    print() {
        printJS({
            printable: this.elementRef.nativeElement.querySelector('.print-preview-container'),
            type: 'html',
            targetStyles: ['*'],
            style: `
                * {
                    font-family: 'Heiti SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                @page {
                    size: A4 portrait;
                    margin: 10mm 10mm 10mm 10mm;
                }
              `
        });
    }
}
