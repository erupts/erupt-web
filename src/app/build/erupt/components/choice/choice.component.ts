import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum} from "../../model/erupt.enum";

@Component({
    selector: 'erupt-choice',
    templateUrl: './choice.component.html',
    styles: []
})
export class ChoiceComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() size;

    @Input() eruptParentName: string;

    @Input() vagueSearch: boolean = false;

    @Input() readonly: boolean = false;

    @Input() checkAll: boolean = false;

    isLoading = false;

    choiceEnum = ChoiceEnum;

    constructor(private dataService: DataService) {
    }

    ngOnInit() {
        if (this.vagueSearch) {
            return;
        }
        if (this.eruptField.eruptFieldJson.edit.choiceType.anewFetch) {
            if (this.eruptField.eruptFieldJson.edit.choiceType.type == ChoiceEnum.RADIO) {
                this.load(true);
            }
        }
    }

    load(open) {
        if (open) {
            if (this.eruptField.eruptFieldJson.edit.choiceType.anewFetch) {
                this.isLoading = true;
                this.dataService.findChoiceItem(this.eruptModel.eruptName, this.eruptField.fieldName, this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    this.isLoading = false;
                });
            }
        }
    }

    changeTagAll($event) {
        for (let vl of this.eruptField.componentValue) {
            vl.$viewValue = $event;
        }
    }

}
