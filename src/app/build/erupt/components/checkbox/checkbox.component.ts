import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Edit, EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {Checkbox} from "../../model/erupt.model";

@Component({
    selector: 'erupt-checkbox',
    templateUrl: './checkbox.component.html',
    styles: []
})
export class CheckboxComponent implements OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptFieldModel: EruptFieldModel;

    @Input() onlyRead: boolean = false;

    checkbox: Checkbox[];

    loading = false;

    edit: Edit;

    constructor(private dataService: DataService) {

    }

    ngOnInit() {
        this.loading = true;
        this.dataService.findCheckBox(this.eruptBuildModel.eruptModel.eruptName, this.eruptFieldModel.fieldName).subscribe(
            result => {
                if (result) {
                    this.edit = this.eruptFieldModel.eruptFieldJson.edit;
                    this.checkbox = result;
                }
                this.loading = false;
            }
        );
    }

    change(e) {
        this.eruptFieldModel.eruptFieldJson.edit.$value = e;
    }

}
