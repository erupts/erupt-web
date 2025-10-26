import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {EditType} from "../../model/erupt.enum";
import {
    EruptSearchModel,
    OperatorDateType,
    OperatorNumberType,
    OperatorReferenceType,
    OperatorStringType,
    OperatorType,
    OperatorUpmsType
} from "../../model/erupt-search.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {UpmsData, UpmsScope} from "../../model/upms.model";

@Component({
    selector: 'erupt-smart-search',
    templateUrl: './smart-search.component.html',
    styleUrls: ['./smart-search.component.less']
})
export class SmartSearchComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() search: EruptSearchModel[][] = [];

    @Output() searchChange = new EventEmitter<EruptSearchModel[][]>();

    @Input() requiredHasCondition: boolean = false;

    @Input() upmsData: UpmsData;

    SUBMITTER = "SUBMITTER";

    searchTypeMapping: Partial<Record<EditType, OperatorType>> = {
        [EditType.INPUT]: OperatorType.STRING,
        [EditType.COLOR]: OperatorType.STRING,
        [EditType.TEXTAREA]: OperatorType.STRING,
        [EditType.MARKDOWN]: OperatorType.STRING,
        [EditType.HTML_EDITOR]: OperatorType.STRING,
        [EditType.CODE_EDITOR]: OperatorType.STRING,
        [EditType.AUTO_COMPLETE]: OperatorType.STRING,

        [EditType.NUMBER]: OperatorType.NUMBER,
        [EditType.SLIDER]: OperatorType.NUMBER,
        [EditType.RATE]: OperatorType.NUMBER,

        [EditType.DATE]: OperatorType.DATE,

        [EditType.BOOLEAN]: OperatorType.BOOLEAN,
        [EditType.CHOICE]: OperatorType.CHOICE,
        [EditType.MULTI_CHOICE]: OperatorType.CHOICE,
        [EditType.REFERENCE_TABLE]: OperatorType.REFERENCE,
        [EditType.REFERENCE_TREE]: OperatorType.REFERENCE,
    };

    constructor(@Inject(NzMessageService) private msg: NzMessageService,) {
    }


    public saveCondition = (): boolean => {
        for (let group of this.search) {
            for (let sh of group) {
                if (!sh.field) {
                    this.msg.error('请选择字段');
                    return false;
                }
                if (!sh.operator) {
                    this.msg.error('请选择运算符');
                    return false;
                }
                if (sh.operator != OperatorDateType.NOT_NULL && sh.operator != OperatorDateType.NULL) {
                    if (sh.value == null) {
                        this.msg.error('请输入值');
                        return false;
                    }
                }
            }
        }
        this.searchChange.emit(this.search);
        return true;
    }

    ngOnInit(): void {
        if (this.requiredHasCondition) {
            if (!this.search || this.search.length === 0) {
                this.search = [[this.createEmptyCondition()]];
            }
        }
    }

    private createEmptyCondition(): EruptSearchModel {
        return {field: '', operatorType: null, operator: null, value: null, upmsScope: null};
    }

    onFieldChange(condition: EruptSearchModel): void {
        if (condition.field === this.SUBMITTER) {
            condition.operatorType = OperatorType.UPMS;
            condition.operator = OperatorStringType.EQ;
            return;
        }
        condition.operatorType = this.searchTypeMapping[this.eruptModel.eruptFieldModelMap.get(condition.field)?.eruptFieldJson.edit.type] || OperatorType.STRING;
        switch (condition.operatorType) {
            case OperatorType.STRING:
                condition.operator = OperatorStringType.EQ;
                break;
            case OperatorType.NUMBER:
                condition.operator = OperatorNumberType.EQ;
                break;
            case OperatorType.DATE:
                condition.operator = OperatorDateType.TODAY;
                break;
            case OperatorType.REFERENCE:
            case OperatorType.BOOLEAN:
            case OperatorType.CHOICE:
            case OperatorType.UPMS:
                condition.operator = OperatorReferenceType.EQ;
                break;
        }
        condition.value = null;
        condition.upmsScope = null;
    }

    onOperatorChange(condition: EruptSearchModel): void {
        if (condition.operatorType === OperatorType.NUMBER && condition.operator === OperatorNumberType.RANGE as OperatorNumberType) {
            condition.value = [];
        } else if (condition.operatorType === OperatorType.CHOICE || condition.operatorType === OperatorType.UPMS) {
            condition.value = [];
        } else {
            condition.value = null;
        }
    }

    // 添加条件组（基于 search）
    addConditionGroup(): void {
        this.search.push([this.createEmptyCondition()]);
    }

    // 删除条件组（基于 search）
    removeConditionGroup(groupIndex: number): void {
        if (groupIndex >= 0 && groupIndex < this.search.length) {
            this.search.splice(groupIndex, 1);
        }
    }

    // 添加条件（基于 search）
    addCondition(groupIndex: number): void {
        if (!this.search[groupIndex]) {
            this.search[groupIndex] = [];
        }
        this.search[groupIndex].push(this.createEmptyCondition());
    }

    // 删除条件（基于 search）
    removeCondition(groupIndex: number, conditionIndex: number): void {
        if (this.search[groupIndex]) {
            this.search[groupIndex].splice(conditionIndex, 1);
        }
    }

    // 重置
    resetForm(): void {
        this.search = [[this.createEmptyCondition()]];
    }

    protected readonly editType = EditType;
    protected readonly OperatorType = OperatorType;
    protected readonly OperatorStringType = OperatorStringType;
    protected readonly OperatorNumberType = OperatorNumberType;
    protected readonly OperatorDateType = OperatorDateType;
    protected readonly OperatorReferenceType = OperatorReferenceType;
    protected readonly OperatorUpmsType = OperatorUpmsType;
    protected readonly UpmsScope = UpmsScope;
}


