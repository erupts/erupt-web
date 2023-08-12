import {Component, DoCheck, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum, DateEnum, EditType} from "../../model/erupt.enum";
import {colRules} from "@shared/model/util.model";
import {DataHandlerService} from "../../service/data-handler.service";

@Component({
    selector: 'erupt-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.less']
})
export class SearchComponent implements OnInit, DoCheck {

    @Input() eruptModel: EruptModel;

    @Output() search = new EventEmitter();

    @Input() size: "large" | "small" | "default" = "large";

    editType = EditType;

    col = colRules[4];

    choiceEnum = ChoiceEnum;

    dateEnum = DateEnum;

    private doChangeCheck: boolean = false;


    constructor(private dataHandlerService: DataHandlerService) {
    }

    ngDoCheck(): void {
        if (this.doChangeCheck) {
            // for (let field of this.eruptModel.eruptFieldModels) {
            //     if (field.eruptFieldJson.edit.search) {
            //         this.dataHandlerService.eruptFieldModelChangeHook(this.eruptModel, field);
            //     }
            // }
        }
    }

    ngOnInit(): void {
        for (let model of this.eruptModel.eruptFieldModels) {
            let edit = model.eruptFieldJson.edit;
            if (edit.search.value && edit.type == EditType.CHOICE) {
                if (edit.choiceType.dependField) {
                    this.doChangeCheck = true;
                }
            }
        }
    }

    enterEvent(event) {
        if (event.which === 13) {
            this.search.emit();
        }
    }


}
