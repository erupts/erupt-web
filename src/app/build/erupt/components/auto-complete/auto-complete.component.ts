import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {NzSizeLDSType} from "ng-zorro-antd/core/types";
import {EruptModel} from "../../model/erupt.model";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";

@Component({
    standalone: false,
    selector: 'erupt-auto-complete',
    templateUrl: './auto-complete.component.html',
    styleUrls: ['./auto-complete.component.less']
})
export class AutoCompleteComponent implements OnInit {

    @Input() field: EruptFieldModel

    @Input() eruptModel: EruptModel

    @Input() eruptBuildModel: EruptBuildModel

    @Input() size: NzSizeLDSType = "large";

    @Input() parentEruptName: string

    constructor(public dataService: DataService,
                private dataHandlerService: DataHandlerService) {
    }

    ngOnInit(): void {
    }

    onAutoCompleteInput(event, fieldModel: EruptFieldModel) {
        let edit = fieldModel.eruptFieldJson.edit;
        const value = edit.$value ? edit.$value.toString().trim() : '';
        // triggerLength 0 asks with nothing typed as well: the full list on focus
        if ((value || edit.autoCompleteType.triggerLength === 0) && edit.autoCompleteType.triggerLength <= value.length) {
            this.fetch(fieldModel, value);
        } else {
            edit.autoCompleteType.items = [];
        }
    }

    // triggerLength 0: focusing the field lists every candidate, whatever it holds now
    onAutoCompleteFocus(fieldModel: EruptFieldModel) {
        if (fieldModel.eruptFieldJson.edit.autoCompleteType.triggerLength === 0) this.fetch(fieldModel, '');
    }

    private fetch(fieldModel: EruptFieldModel, value: string) {
        const edit = fieldModel.eruptFieldJson.edit;
        const data = this.eruptBuildModel
            ? this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)
            : {};
        this.dataService.findAutoCompleteValue(this.eruptModel.eruptName, fieldModel.fieldName, data, value, this.parentEruptName).subscribe(res => {
            edit.autoCompleteType.items = res;
        });
    }

}
