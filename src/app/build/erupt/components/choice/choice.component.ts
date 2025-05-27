import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel, VL} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {ChoiceEnum} from "../../model/erupt.enum";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from "@core";
import {EditTypeComponent} from "../edit-type/edit-type.component";

@Component({
    selector: 'erupt-choice',
    templateUrl: './choice.component.html',
    styleUrls: ['./choice.component.less'],
    styles: []
})
export class ChoiceComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() editType: EditTypeComponent;

    @Input() eruptParentName: string;

    @Input() vagueSearch: boolean = false;

    @Input() readonly: boolean = false;

    @Input() checkAll: boolean = false;

    @Input() size: 'large' | 'small' | "default" = "default";

    isLoading = false;

    choiceEnum = ChoiceEnum;

    choiceVL: VL[] = [];

    constructor(private dataService: DataService, private msg: NzMessageService, private i18n: I18NService) {
    }

    ngOnInit() {
        if (this.eruptField.eruptFieldJson.edit.choiceType.dependField) {
            this.eruptModel.eruptFieldModelMap.get(this.eruptField.eruptFieldJson.edit.choiceType.dependField).eruptFieldJson.edit.$valueSubject?.asObservable().subscribe(val => {
                let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
                let clean = () => {
                    if (this.choiceVL.filter(it => it.value == this.eruptField.eruptFieldJson.edit.$value).length == 0) {
                        this.eruptField.eruptFieldJson.edit.$value = null;
                    }
                }
                if (choiceType.dependExpr == '') {
                    this.dataService.findChoiceItemFilter(this.eruptModel.eruptName, this.eruptField.fieldName, this.getFromData(), this.eruptParentName).subscribe(data => {
                        this.choiceVL = data;
                        clean();
                    })
                } else {
                    this.choiceVL = this.eruptField.componentValue.filter(vl => {
                        try {
                            return eval(choiceType.dependExpr);
                        } catch (e) {
                            this.msg.error(e);
                        } finally {
                            clean();
                        }
                    })
                }

            })
        } else {
            this.choiceVL = this.eruptField.componentValue
        }
    }

    valueChange(val: any) {
        if (this.eruptField.eruptFieldJson.edit.choiceType.trigger) {
            if (this.editType) {
                this.isLoading = true;
                this.dataService.choiceTrigger(this.eruptModel.eruptName, this.eruptField.fieldName, val, this.eruptParentName).subscribe(data => {
                    if (data) {
                        this.editType.fillForm(data);
                    }
                    this.isLoading = false;
                })
            }
        }
    }

    getFromData(): any {
        let result = {};
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            result[eruptFieldModel.fieldName] = eruptFieldModel.eruptFieldJson.edit.$value;
        }
        return result;
    }

    load(open) {
        let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
        if (open) {
            if (choiceType.anewFetch) {
                this.isLoading = true;
                this.dataService.findChoiceItemFilter(this.eruptModel.eruptName, this.eruptField.fieldName, this.getFromData(), this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    this.choiceVL = data;
                    this.isLoading = false;
                })
            }
        }
    }

}
