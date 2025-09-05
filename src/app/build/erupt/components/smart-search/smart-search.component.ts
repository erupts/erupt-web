import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {EditType} from "../../model/erupt.enum";
import {
    EruptSearchModel,
    OperatorDateType,
    OperatorNumberType,
    OperatorReferenceType,
    OperatorStringType,
    OperatorType
} from "../../model/erupt-search.model";
import {LV} from "../../model/common.model";

@Component({
    selector: 'erupt-smart-search',
    templateUrl: './smart-search.component.html',
    styleUrls: ['./smart-search.component.less']
})
export class SmartSearchComponent implements OnInit, OnChanges {

    @Input() eruptModel: EruptModel;

    @Output() searchChange = new EventEmitter<EruptSearchModel[][]>();

    @Input() search: EruptSearchModel[][] = [];

    @Input() requiredHasCondition: boolean = false;

    ngOnInit(): void {
        if (this.requiredHasCondition) {
            if (!this.search || this.search.length === 0) {
                this.search = [[this.createEmptyCondition()]];
            }
        }
    }

    getOperator(field: string): LV<string, string>[] {
        let res: LV<string, string>[] = [];
        if (!this.eruptModel || !this.eruptModel.eruptFieldModelMap.get(field)) {
            return res;
        }
        let type: EditType = this.eruptModel.eruptFieldModelMap.get(field).eruptFieldJson.edit.type;
        let operatorNameMap = {
            TODAY: '今天',
            FEW_DAYS: '过去 N 天',
            FUTURE_DAYS: '未来 N 天',
            RANGE: '区间',
            GT: '大于',
            LT: '小于',
            EGT: '大于等于',
            ELT: '小于等于',
            NULL: '为空',
            NOT_NULL: '非空',
            EQ: '等于',
            NEQ: '不等于',
            LIKE: '相似',
            NOT_LIKE: '不相似',
            START_WITH: '以**开始',
            END_WITH: '以**结尾',
            IN: '包含于',
            NOT_IN: '不包含于',
        };
        switch (type) {
            case EditType.NUMBER:
            case EditType.SLIDER:
            case EditType.RATE:
                for (let key in OperatorNumberType) {
                    res.push({label: operatorNameMap[key] || key, value: key});
                }
                return res;
            case EditType.DATE:
                for (let key in OperatorDateType) {
                    res.push({label: operatorNameMap[key] || key, value: key});
                }
                return res;
            case EditType.CHOICE:
            case EditType.MULTI_CHOICE:
            case EditType.REFERENCE_TABLE:
            case EditType.REFERENCE_TREE:
            case EditType.BOOLEAN:
                for (let key in OperatorReferenceType) {
                    res.push({label: operatorNameMap[key] || key, value: key});
                }
                return res;
            default:
                for (let key in OperatorStringType) {
                    res.push({label: operatorNameMap[key] || key, value: key});
                }
                return res;
        }
    }

    isInputOperator(operator: string): boolean {
        return [OperatorStringType.LIKE, OperatorStringType.NOT_LIKE, OperatorStringType.START_WITH, OperatorStringType.END_WITH].includes(operator as OperatorStringType);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['search'] && !changes['search'].firstChange) {
            // 保证每个分组至少有一个条件项
            if (this.search.length === 0) {
                this.search = [[this.createEmptyCondition()]];
            } else {
                this.search = this.search.map(group => (group && group.length ? group : [this.createEmptyCondition()]));
            }
        }
    }

    private createEmptyCondition(): EruptSearchModel {
        return {field: '', operatorType: OperatorType.STRING, operator: OperatorStringType.EQ, value: ''};
    }

    onFieldChange(groupIndex: number, conditionIndex: number): void {
        const condition = this.search[groupIndex]?.[conditionIndex];
        if (!condition) return;
        const ops = this.getOperator(condition.field) || [];
        if (ops.length) {
            condition.operator = ops[0].value as EruptSearchModel['operator'];
        }
        condition.value = undefined;
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
}


