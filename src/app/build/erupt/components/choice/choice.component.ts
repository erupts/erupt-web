import {Component, Input, OnInit} from '@angular/core';
import {ChoiceEnum} from "../../model/erupt.enum";
import {EruptFieldModel, VL} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from "@core";
import {EditTypeComponent} from "../edit-type/edit-type.component";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";

@Component({
    standalone: false,
    selector: 'erupt-choice',
    templateUrl: './choice.component.html',
    styleUrls: ['./choice.component.less'],
    styles: []
})
export class ChoiceComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptField: EruptFieldModel;

    @Input() editType: EditTypeComponent;

    @Input() eruptParentName: string;

    @Input() readonly: boolean = false;

    @Input() checkAll: boolean = false;

    @Input() size: 'large' | 'small' | "default" = "default";

    isLoading = false;

    choiceEnum = ChoiceEnum;

    @Input() selectMode: boolean = false;

    choiceVL: VL[] = [];

    constructor(private dataService: DataService,
                private msg: NzMessageService,
                private i18n: I18NService,
                private dataHandlerService: DataHandlerService) {
    }

    ngOnInit() {
        if (this.eruptField.eruptFieldJson.edit.choiceType.dependField) {
            this.eruptModel.eruptFieldModelMap.get(this.eruptField.eruptFieldJson.edit.choiceType.dependField).eruptFieldJson.edit.$valueSubject?.asObservable().subscribe(val => {
                let clean = () => {
                    if (this.choiceVL.filter(it => it.value == this.eruptField.eruptFieldJson.edit.$value).length == 0) {
                        this.eruptField.eruptFieldJson.edit.$value = null;
                    }
                }
                this.dataService.findChoiceItemFilter(this.eruptModel.eruptName, this.eruptField.fieldName, this.getFormData(), this.eruptParentName).subscribe(data => {
                    this.choiceVL = data;
                    clean();
                })
            })
        } else {
            this.choiceVL = this.eruptField.componentValue
        }
    }

    getFormData(): object {
        return this.eruptBuildModel
            ? this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)
            : {};
    }

    refresh() {
        this.isLoading = true;
        this.dataService.findChoiceItemFilter(this.eruptModel.eruptName, this.eruptField.fieldName, this.getFormData(), this.eruptParentName).subscribe(data => {
            this.eruptField.componentValue = data;
            this.choiceVL = data;
            this.isLoading = false;
        });
    }

}
