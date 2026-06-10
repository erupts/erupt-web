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
        if (edit.$value && edit.autoCompleteType.triggerLength <= edit.$value.toString().trim().length) {
            const data = this.eruptBuildModel
                ? this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)
                : {};
            this.dataService.findAutoCompleteValue(this.eruptModel.eruptName, fieldModel.fieldName, data, edit.$value, this.parentEruptName).subscribe(res => {
                edit.autoCompleteType.items = res;
            });
        } else {
            edit.autoCompleteType.items = [];
        }
    }

}
