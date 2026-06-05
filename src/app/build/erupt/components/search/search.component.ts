import {
    Component,
    DoCheck,
    EventEmitter,
    Input,
    KeyValueDiffers,
    OnInit,
    Output,
    QueryList,
    ViewChildren
} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum, EditType} from "../../model/erupt.enum";
import {colRules} from "@shared/model/util.model";
import {ChoiceComponent} from "../choice/choice.component";
import {BehaviorSubject} from "rxjs";

@Component({
    standalone: false,
    selector: 'erupt-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.less']
})
export class SearchComponent implements OnInit, DoCheck {

    @Input() searchEruptModel: EruptModel;

    @Output() search = new EventEmitter();

    @Input() size: "large" | "small" | "default" = "large";


    @ViewChildren('choice') choices: QueryList<ChoiceComponent>;

    editType = EditType;

    col = colRules[4];

    choiceEnum = ChoiceEnum;

    collapsed = true;

    readonly VISIBLE_COUNT = 4;

    constructor(private differs: KeyValueDiffers,) {
    }

    get searchFields() {
        return this.searchEruptModel.eruptFieldModels.filter(
            f => f.eruptFieldJson.edit && f.eruptFieldJson.edit.search.value
        );
    }

    get showToggle(): boolean {
        return this.searchFields.length > this.VISIBLE_COUNT;
    }

    isVisible(field: any): boolean {
        if (!this.collapsed) return true;
        return this.searchFields.indexOf(field) < this.VISIBLE_COUNT;
    }

    ngDoCheck(): void {
        for (let eruptFieldModel of this.searchEruptModel.eruptFieldModels) {
            if (eruptFieldModel.eruptFieldJson.edit.$valueDiff.diff(eruptFieldModel.eruptFieldJson.edit)) {
                eruptFieldModel.eruptFieldJson.edit.$valueSubject.next(eruptFieldModel.eruptFieldJson.edit.$value);
            }
        }
    }

    ngOnInit(): void {
        for (let model of this.searchEruptModel.eruptFieldModels) {
            model.eruptFieldJson.edit.$valueDiff = this.differs.find(model.eruptFieldJson.edit).create();
            model.eruptFieldJson.edit.$valueSubject = new BehaviorSubject<any>(null);
        }
    }

    enterEvent(event) {
        if (event.which === 13) {
            this.search.emit();
        }
    }


}
