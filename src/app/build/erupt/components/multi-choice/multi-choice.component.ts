import {Component, Input} from '@angular/core';
import {MultiChoiceEnum} from "../../model/erupt.enum";
import {EruptModel} from "../../model/erupt.model";
import {EruptFieldModel} from "../../model/erupt-field.model";

@Component({
    selector: 'erupt-multi-choice',
    templateUrl: './multi-choice.component.html',
    styleUrls: ['./multi-choice.component.less']
})
export class MultiChoiceComponent  {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() readonly: boolean = false;

    @Input() size: 'large' | 'small' | "default" = "default";

    multiChoiceEnum = MultiChoiceEnum;

    isNumeric(str:string): boolean {
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
