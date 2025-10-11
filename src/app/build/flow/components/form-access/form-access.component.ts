import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FormAccessEnum} from "@flow/model/flow.model";

@Component({
    selector: 'app-form-access',
    templateUrl: './form-access.component.html',
    styleUrls: ['./form-access.component.less']
})
export class FormAccessComponent implements OnInit {

    @Input() eruptBuild: EruptBuildModel;

    radioValue: string;

    @Input() formAccesses: Record<string, FormAccessEnum> = {};

    @Input() access: FormAccessEnum = FormAccessEnum.READONLY;

    protected readonly FormAccessEnum = FormAccessEnum;

    ngOnInit(): void {
        for (let eruptFieldModel of this.eruptBuild.eruptModel.eruptFieldModels) {
            if (!this.formAccesses[eruptFieldModel.fieldName]) {
                this.formAccesses[eruptFieldModel.fieldName] = this.access;
            }
        }
    }
}
