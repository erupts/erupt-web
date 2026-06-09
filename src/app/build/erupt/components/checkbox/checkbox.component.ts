import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Edit, EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {Checkbox} from "../../model/erupt.model";

@Component({
    standalone: false,
    selector: 'erupt-checkbox',
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.less']
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

    onCheckChange(id: any, checked: boolean) {
        const values: any[] = this.eruptFieldModel.eruptFieldJson.edit.$value || [];
        if (checked) {
            if (values.indexOf(id) === -1) values.push(id);
        } else {
            const idx = values.indexOf(id);
            if (idx !== -1) values.splice(idx, 1);
        }
        this.eruptFieldModel.eruptFieldJson.edit.$value = [...values];
    }

    isAllChecked(): boolean {
        if (!this.checkbox?.length || !this.edit?.$value) return false;
        return this.checkbox.every(c => this.edit.$value.indexOf(c.id) !== -1);
    }

    isIndeterminate(): boolean {
        if (!this.checkbox?.length || !this.edit?.$value?.length) return false;
        return !this.isAllChecked() && this.checkbox.some(c => this.edit.$value.indexOf(c.id) !== -1);
    }

    toggleAll(checked: boolean) {
        if (checked) {
            this.eruptFieldModel.eruptFieldJson.edit.$value = this.checkbox.map(c => c.id);
        } else {
            this.eruptFieldModel.eruptFieldJson.edit.$value = [];
        }
    }

}
