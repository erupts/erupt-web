import {Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum, DateEnum, EditType} from "../../model/erupt.enum";
import {colRules} from "@shared/model/util.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {ChoiceComponent} from "../choice/choice.component";

@Component({
    selector: 'erupt-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.less']
})
export class SearchComponent implements OnInit {

    @Input() searchEruptModel: EruptModel;

    @Output() search = new EventEmitter();

    @Input() size: "large" | "small" | "default" = "large";


    @ViewChildren('choice') choices: QueryList<ChoiceComponent>;

    editType = EditType;

    col = colRules[4];

    choiceEnum = ChoiceEnum;

    dateEnum = DateEnum;


    constructor(private dataHandlerService: DataHandlerService) {
    }

    // ngDoCheck(): void {
    //     if (this.choices && this.choices.length > 0) {
    //         for (let choice of this.choices) {
    //             this.dataHandlerService.eruptFieldModelChangeHook(this.searchEruptModel, choice.eruptField, (value) => {
    //                 for (let choice of this.choices) {
    //                     choice.dependChange(value);
    //                 }
    //             });
    //         }
    //     }
    // }

    ngOnInit(): void {

    }

    enterEvent(event) {
        if (event.which === 13) {
            this.search.emit();
        }
    }


}
