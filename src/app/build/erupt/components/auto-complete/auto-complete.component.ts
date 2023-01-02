import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {NzSizeLDSType} from "ng-zorro-antd/core/types";
import {EruptModel} from "../../model/erupt.model";

@Component({
    selector: 'erupt-auto-complete',
    templateUrl: './auto-complete.component.html',
    styleUrls: ['./auto-complete.component.less']
})
export class AutoCompleteComponent implements OnInit {

    @Input() field: EruptFieldModel

    @Input() eruptModel: EruptModel

    @Input() size: NzSizeLDSType = "large";

    @Input() parentEruptName: string

    constructor(public dataService: DataService,) {
    }

    ngOnInit(): void {
    }

    getFromData(): any {
        let result = {};
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            result[eruptFieldModel.fieldName] = eruptFieldModel.eruptFieldJson.edit.$value;
        }
        return result;
    }

    onAutoCompleteInput(event, fieldModel: EruptFieldModel) {
        let edit = fieldModel.eruptFieldJson.edit;
        if (edit.$value && edit.autoCompleteType.triggerLength <= edit.$value.toString().trim().length) {
            this.dataService.findAutoCompleteValue(this.eruptModel.eruptName, fieldModel.fieldName, this.getFromData(), edit.$value, this.parentEruptName).subscribe(res => {
                edit.autoCompleteType.items = res;
            });
        } else {
            edit.autoCompleteType.items = [];
        }
    }

}
