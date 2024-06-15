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

    //是否开启联动功能
    @Input() dependLinkage = true;

    isLoading = false;

    choiceEnum = ChoiceEnum;

    choiceVL: VL[] = [];

    constructor(private dataService: DataService, private msg: NzMessageService, private i18n: I18NService) {
    }

    ngOnInit() {
        if (this.vagueSearch) {
            this.choiceVL = this.eruptField.componentValue
            return;
        }
        let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
        if (choiceType.anewFetch) {
            if (choiceType.type == ChoiceEnum.RADIO) {
                this.load(true);
            }
        }
        if (!this.dependLinkage || !choiceType.dependField) {
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

    //依赖值发生变化
    dependChange(value) {
        let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
        if (choiceType.dependField) {
            let dependValue = value;
            for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
                if (eruptFieldModel.fieldName == choiceType.dependField) {
                    this.choiceVL = this.eruptField.componentValue.filter(vl => {
                        try {
                            return eval(choiceType.dependExpr);
                        } catch (e) {
                            this.msg.error(e);
                        }
                    })
                    break;
                }
            }
        }
    }

    load(open) {
        let choiceType = this.eruptField.eruptFieldJson.edit.choiceType;
        if (open) {
            if (choiceType.anewFetch) {
                this.isLoading = true;
                this.dataService.findChoiceItem(this.eruptModel.eruptName, this.eruptField.fieldName, this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    this.isLoading = false;
                });
            }
            if (this.dependLinkage && choiceType.dependField) {
                for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
                    if (eruptFieldModel.fieldName == choiceType.dependField) {
                        let dependValue = eruptFieldModel.eruptFieldJson.edit.$value;
                        if (null === dependValue || "" === dependValue || undefined === dependValue) {
                            this.msg.warning(this.i18n.fanyi("global.pre_select") + eruptFieldModel.eruptFieldJson.edit.title)
                            this.choiceVL = [];
                        }
                    }
                }
            }
        }
    }

    changeTagAll($event) {
        for (let vl of this.eruptField.componentValue) {
            vl.$viewValue = $event;
        }
    }

}
