import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {EruptModel} from "../../model/erupt.model";
import {EditType} from "../../model/erupt.enum";

export interface ConditionField {
    id: string;
    name: string;
    type: 'string' | 'number' | 'date' | 'select';
    options?: { value: string; label: string }[];
}

export interface ConditionItem {
    field: string;
    operator: string;
    value: string;
}

export interface ConditionGroup {
    id: string;
    conditions: ConditionItem[];
    logicOperator: 'and' | 'or';
}

@Component({
    selector: 'app-smart-search',
    templateUrl: './smart-search.component.html',
    styleUrls: ['./smart-search.component.less']
})
export class SmartSearchComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    conditionForm: FormGroup;

    // 可用的字段
    availableFields: ConditionField[] = [
        {
            id: 'paymentMethod', name: '付款方式', type: 'select', options: [
                {value: 'bankCard', label: '银行卡'},
                {value: 'alipay', label: '支付宝'},
                {value: 'wechat', label: '微信支付'},
                {value: 'cash', label: '现金'}
            ]
        },
        {id: 'amount', name: '金额', type: 'number'},
        {id: 'date', name: '日期', type: 'date'},
        {
            id: 'status', name: '状态', type: 'select', options: [
                {value: 'pending', label: '待处理'},
                {value: 'completed', label: '已完成'},
                {value: 'failed', label: '失败'}
            ]
        }
    ];

    // 操作符
    operators = [
        {value: 'equals', label: '等于'},
        {value: 'notEquals', label: '不等于'},
        {value: 'contains', label: '包含'},
        {value: 'greaterThan', label: '大于'},
        {value: 'lessThan', label: '小于'},
        {value: 'between', label: '介于'}
    ];

    constructor(private fb: FormBuilder) {
        this.conditionForm = this.fb.group({
            conditionGroups: this.fb.array([])
        });
    }

    ngOnInit(): void {
        // 初始化一个条件组
        this.addConditionGroup();
    }

    get conditionGroups(): FormArray {
        return this.conditionForm.get('conditionGroups') as FormArray;
    }

    // 添加条件组
    addConditionGroup(): void {
        const conditionGroup = this.fb.group({
            id: [this.generateId()],
            logicOperator: ['and'],
            conditions: this.fb.array([])
        });

        this.conditionGroups.push(conditionGroup);

        // 为新条件组添加一个初始条件
        this.addCondition(this.conditionGroups.length - 1);
    }

    // 删除条件组
    removeConditionGroup(groupIndex: number): void {
        this.conditionGroups.removeAt(groupIndex);
    }

    // 获取条件组中的条件数组
    getConditions(groupIndex: number): FormArray {
        return this.conditionGroups.at(groupIndex).get('conditions') as FormArray;
    }

    // 添加条件
    addCondition(groupIndex: number): void {
        const condition = this.fb.group({
            field: ['', Validators.required],
            operator: ['equals', Validators.required],
            value: ['', Validators.required]
        });

        this.getConditions(groupIndex).push(condition);
    }

    // 删除条件
    removeCondition(groupIndex: number, conditionIndex: number): void {
        this.getConditions(groupIndex).removeAt(conditionIndex);
    }

    // 获取字段的选项
    getFieldOptions(fieldId: string): { value: string; label: string }[] {
        const field = this.availableFields.find(f => f.id === fieldId);
        return field?.options || [];
    }

    // 生成唯一ID
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 提交表单
    onSubmit(): void {
        if (this.conditionForm.valid) {
            console.log('条件设置:', this.conditionForm.value);
            // 这里可以处理提交逻辑
        }
    }

    // 重置表单
    resetForm(): void {
        this.conditionForm.reset();
        this.conditionGroups.clear();
        this.addConditionGroup();
    }

    protected readonly editType = EditType;
}
