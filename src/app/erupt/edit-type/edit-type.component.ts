import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Edit, EruptFieldModel, ReferenceType, VL} from "../model/erupt-field.model";
import {ChoiceEnum, DateEnum, EditType} from "../model/erupt.enum";
import {DataService} from "../service/data.service";
import {ModalHelper} from "@delon/theme";
import {ListSelectComponent} from "../list-select/list-select.component";
import {NzModalService} from "ng-zorro-antd/modal";

interface col {
    xs?: number,
    sm?: number,
    md?: number,
    lg?: number,
    xl?: number,
    xxl?: number
}


@Component({
    selector: 'erupt-edit-type',
    templateUrl: './edit-type.component.html',
    styleUrls: ['./edit-type.component.less']
})
export class EditTypeComponent implements OnInit {

    //important
    @Input() eruptFieldModels: EruptFieldModel;

    //important
    @Input() eruptName: string;

    @Input() size: 'large' | 'small' | 'default' = 'large';

    editType = EditType;

    choiceEnum = ChoiceEnum;

    dateEnum = DateEnum;

    referenceLists: Array<ReferenceType>;

    @Input() col: col = {
        xs: 24,
        sm: 24,
        md: 12,
        lg: 12,
        xl: 8,
        xxl: 8
    };

    @Input() layout: 'horizontal' | 'vertical' | 'inline' = 'vertical';
    @ViewChild('refFoot') refFoot;


    constructor(private dataService: DataService, private modalHelper: ModalHelper) {

    }


    createRefModal(field: EruptFieldModel) {
        this.dataService.queryEruptReferenceData(this.eruptName, field.fieldName).subscribe(data => {
            let sub = this.modalHelper.create(ListSelectComponent, {list: data, eruptField: field}, {
                size: 'sm',
                modalOptions: {
                    nzFooter: [
                        {
                            label: "确定",
                            type: "primary",
                            // onClick: (button, dialog) => {
                            //     console.log(button);
                            //     console.log(dialog);
                            //     const tempVal = field.eruptFieldJson.edit.$tempValue;
                            //     field.eruptFieldJson.edit.$viewValue = tempVal.label;
                            //     field.eruptFieldJson.edit.$value = tempVal.id;
                            // }
                        },
                        {
                            label: "取消",
                            onClick: () => {

                            }
                        }]
                }
            }).subscribe(() => {
                alert(233);
            });
        });

    }


    checkRefValue(edit: Edit) {
        // if (!edit.referenceType[0].tempVal) {
        //     // this.toastr.warning("未选中数据项", "");
        //     return;
        // }
        edit.$value = edit.referenceType[0].id;
        edit.$viewValue = edit.referenceType[0].label;
    }

    openModal(template: TemplateRef<any>) {
    }

    ngOnInit() {
        console.log(this.eruptFieldModels)
    }

    dateChange(event, field: EruptFieldModel) {
        console.log(event);
        field.eruptFieldJson.edit.$value = event.value;
        console.log(field.eruptFieldJson.edit.$value);
    }


    clearValue(field: EruptFieldModel, event: Event) {
        if (event) {
            event.stopPropagation();
        }
        field.eruptFieldJson.edit.$value = null;
        field.eruptFieldJson.edit.$viewValue = null;
        field.eruptFieldJson.edit.$tempValue = null;
    }


}
