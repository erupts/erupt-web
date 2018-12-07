import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Edit, EruptFieldModel, ReferenceType} from "../model/erupt-field.model";
import {ChoiceEnum, DateEnum, EditType} from "../model/erupt.enum";
import {DataService} from "../service/data.service";
import {ModalHelper} from "@delon/theme";

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

    @ViewChild('refModal') refModal;

    @ViewChild('refFoot') refFoot;


    constructor(private dataService: DataService, private modalHelper: ModalHelper) {

    }


    createRefModal(field: EruptFieldModel) {
        this.referenceLists = null;
        let sub = this.modalHelper.create(this.refModal, {field}, {
            size: 'sm', modalOptions: {
                nzFooter: this.refFoot
            }
        }).subscribe(() => {
            alert(233);
        });
        console.log(sub);
        field.eruptFieldJson.edit.referenceType[0].tempVal = null;
        this.dataService.queryEruptReferenceData(this.eruptName, field.fieldName).subscribe(data => {
            this.referenceLists = data;
        });

    }


    checkRefValue(edit: Edit) {
        if (!edit.referenceType[0].tempVal) {
            // this.toastr.warning("未选中数据项", "");
            return;
        }
        edit.$value = edit.referenceType[0].tempVal.id;
        edit.$viewValue = edit.referenceType[0].tempVal.label;
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
    }


}
