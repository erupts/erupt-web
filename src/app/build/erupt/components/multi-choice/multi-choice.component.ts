import {Component, Input, OnInit} from '@angular/core';
import {MultiChoiceEnum} from "../../model/erupt.enum";
import {EruptModel} from "../../model/erupt.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: 'erupt-multi-choice',
    templateUrl: './multi-choice.component.html',
    styleUrls: ['./multi-choice.component.less']
})
export class MultiChoiceComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() readonly: boolean = false;

    @Input() size: 'large' | 'small' | "default" = "default";

    @Input() eruptParentName: string;

    multiChoiceEnum = MultiChoiceEnum;

    constructor(private dataService: DataService) {

    }

    ngOnInit(): void {
        if (this.eruptField.eruptFieldJson.edit.multiChoiceType.dependField) {
            this.eruptModel.eruptFieldModelMap.get(this.eruptField.eruptFieldJson.edit.multiChoiceType.dependField)
                .eruptFieldJson.edit.$valueSubject?.asObservable().subscribe(val => {
                this.dataService.findChoiceItemFilter(this.eruptModel.eruptName, this.eruptField.fieldName, this.getFromData(), this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    if (this.eruptField.eruptFieldJson.edit.$value) {
                        this.eruptField.eruptFieldJson.edit.$value = this.eruptField.eruptFieldJson.edit.$value.filter((value) => {
                            return this.eruptField.componentValue.some(cv => cv.value == String(value));
                        })

                        //
                        // if (this.eruptField.componentValue.filter((it: VL) => this.eruptField.eruptFieldJson.edit.$value?.some(value => String(value) === it.value)).length == 0) {
                        //     this.eruptField.eruptFieldJson.edit.$value = [];
                        // }
                    }
                })
            })
        }
    }


    getFromData(): any {
        let result = {};
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            result[eruptFieldModel.fieldName] = eruptFieldModel.eruptFieldJson.edit.$value;
        }
        return result;
    }

    isNumeric(str: string): boolean {
        return !isNaN(parseFloat(str)) && isFinite(parseFloat(str));
    }

    includes(arr: any[], ele: any) {
        if (arr) {
            return arr.some(item => item == ele)
        }
        return false;
    }

    checkboxChange(e: any[]) {
        this.eruptField.eruptFieldJson.edit.$value = e;
    }

    protected readonly parseInt = parseInt;

}
