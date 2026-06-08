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
import {EruptFieldModel} from "../../model/erupt-field.model";
import {QueryExpression} from "../../model/erupt.vo";
import {I18NService} from "@core";

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

    constructor(private differs: KeyValueDiffers, private i18n: I18NService) {
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
            if (model.eruptFieldJson.edit?.search?.value && model.eruptFieldJson.edit.$operator == null) {
                const opts = this.getOperatorOptions(model);
                if (opts.length) {
                    model.eruptFieldJson.edit.$operator = opts[0].value;
                }
            }
        }
    }

    enterEvent(event) {
        if (event.which === 13) {
            this.search.emit();
        }
    }

    readonly qe = QueryExpression;

    private t(key: string): string {
        return this.i18n.fanyi(key);
    }

    getOperatorOptions(field: EruptFieldModel): {label: string, abbr: string, value: QueryExpression}[] {
        const edit = field.eruptFieldJson.edit;
        if (!edit) return [];
        switch (edit.type) {
            case EditType.INPUT:
            case EditType.TEXTAREA:
            case EditType.HTML_EDITOR:
            case EditType.CODE_EDITOR:
            case EditType.AUTO_COMPLETE:
                return [
                    {abbr: '=',  label: `= ${this.t('query.op.eq')}`,        value: QueryExpression.EQ},
                    {abbr: '≠',  label: `≠ ${this.t('query.op.neq')}`,       value: QueryExpression.NEQ},
                    {abbr: '≈',  label: `≈ ${this.t('query.op.like')}`,      value: QueryExpression.LIKE},
                    {abbr: '≉',  label: `≉ ${this.t('query.op.not_like')}`,  value: QueryExpression.NOT_LIKE},
                    {abbr: '∈',  label: `∈ ${this.t('query.op.in')}`,        value: QueryExpression.IN},
                    {abbr: '∉',  label: `∉ ${this.t('query.op.not_in')}`,   value: QueryExpression.NOT_IN},
                    {abbr: '∅',  label: `∅ ${this.t('query.op.null')}`,      value: QueryExpression.NULL},
                    {abbr: '!∅', label: `!∅ ${this.t('query.op.not_null')}`, value: QueryExpression.NOT_NULL},
                ];
            case EditType.NUMBER:
                return [
                    {abbr: '=',  label: `= ${this.t('query.op.eq')}`,         value: QueryExpression.EQ},
                    {abbr: '≠',  label: `≠ ${this.t('query.op.neq')}`,        value: QueryExpression.NEQ},
                    {abbr: '>',  label: `> ${this.t('query.op.gt')}`,         value: QueryExpression.GT},
                    {abbr: '≥',  label: `≥ ${this.t('query.op.gte')}`,        value: QueryExpression.GTE},
                    {abbr: '<',  label: `< ${this.t('query.op.lt')}`,         value: QueryExpression.LT},
                    {abbr: '≤',  label: `≤ ${this.t('query.op.lte')}`,        value: QueryExpression.LTE},
                    {abbr: '~',  label: `~ ${this.t('query.op.range')}`,      value: QueryExpression.RANGE},
                    {abbr: '∈',  label: `∈ ${this.t('query.op.in')}`,         value: QueryExpression.IN},
                    {abbr: '∉',  label: `∉ ${this.t('query.op.not_in')}`,     value: QueryExpression.NOT_IN},
                    {abbr: '∅',  label: `∅ ${this.t('query.op.null')}`,       value: QueryExpression.NULL},
                    {abbr: '!∅', label: `!∅ ${this.t('query.op.not_null')}`,  value: QueryExpression.NOT_NULL},
                ];
            case EditType.DATE:
                return [
                    {abbr: '~',  label: `~ ${this.t('query.op.range')}`,      value: QueryExpression.RANGE},
                    {abbr: '=',  label: `= ${this.t('query.op.eq')}`,         value: QueryExpression.EQ},
                    {abbr: '>',  label: `> ${this.t('query.op.gt')}`,         value: QueryExpression.GT},
                    {abbr: '≥',  label: `≥ ${this.t('query.op.gte')}`,        value: QueryExpression.GTE},
                    {abbr: '<',  label: `< ${this.t('query.op.lt')}`,         value: QueryExpression.LT},
                    {abbr: '≤',  label: `≤ ${this.t('query.op.lte')}`,        value: QueryExpression.LTE},
                    {abbr: '∅',  label: `∅ ${this.t('query.op.null')}`,       value: QueryExpression.NULL},
                    {abbr: '!∅', label: `!∅ ${this.t('query.op.not_null')}`,  value: QueryExpression.NOT_NULL},
                ];
            case EditType.REFERENCE_TABLE:
            case EditType.REFERENCE_TREE:
                return [
                    {abbr: '=',  label: `= ${this.t('query.op.eq')}`,         value: QueryExpression.EQ},
                    {abbr: '≠',  label: `≠ ${this.t('query.op.neq')}`,        value: QueryExpression.NEQ},
                    {abbr: '∅',  label: `∅ ${this.t('query.op.null')}`,       value: QueryExpression.NULL},
                    {abbr: '!∅', label: `!∅ ${this.t('query.op.not_null')}`,  value: QueryExpression.NOT_NULL},
                ];
            case EditType.CHOICE:
                if (edit.choiceType?.type === ChoiceEnum.RADIO) {
                    return [];
                }
                return [
                    {abbr: '=',  label: `= ${this.t('query.op.eq')}`,         value: QueryExpression.EQ},
                    {abbr: '≠',  label: `≠ ${this.t('query.op.neq')}`,        value: QueryExpression.NEQ},
                    {abbr: '∅',  label: `∅ ${this.t('query.op.null')}`,       value: QueryExpression.NULL},
                    {abbr: '!∅', label: `!∅ ${this.t('query.op.not_null')}`,  value: QueryExpression.NOT_NULL},
                ];
            default:
                return [];
        }
    }

    getDisplayType(field: EruptFieldModel): EditType {
        const type = field.eruptFieldJson.edit.type;
        if (type === EditType.TEXTAREA || type === EditType.HTML_EDITOR || type === EditType.CODE_EDITOR) {
            return EditType.INPUT;
        }
        if (type === EditType.REFERENCE_TREE) {
            return EditType.REFERENCE_TABLE;
        }
        return type;
    }

    isNullOp(field: EruptFieldModel): boolean {
        const op = field.eruptFieldJson.edit?.$operator;
        return op === QueryExpression.NULL || op === QueryExpression.NOT_NULL;
    }

    isRangeOp(field: EruptFieldModel): boolean {
        return field.eruptFieldJson.edit?.$operator === QueryExpression.RANGE;
    }

    isTagsInputOp(field: EruptFieldModel): boolean {
        const op = field.eruptFieldJson.edit?.$operator;
        return op === QueryExpression.IN || op === QueryExpression.NOT_IN;
    }

    onOperatorChange(field: EruptFieldModel): void {
        field.eruptFieldJson.edit.$value = null;
        field.eruptFieldJson.edit.$l_val = null;
        field.eruptFieldJson.edit.$r_val = null;
    }

}
