import {ChoiceEnum, DateEnum, EditType, InputEnum, UiColor, ViewType} from "./erupt.enum";
/**
 * Created by liyuepeng on 10/17/18.
 */
export interface EruptFieldModel {
    fieldName: string;
    fieldReturnName?: string;
    eruptFieldJson: EruptField;
}


//field detail
export interface EruptField {
    views?: Array<View>;
    edit?: Edit;
}

export interface View {
    className: string;
    column: string;
    title: string;
    show: boolean;
    sort: number;
    viewType: ViewType;
    template: string;
    sortable: boolean;
    //extra
    eruptFieldModel?: EruptFieldModel;
}

export interface Edit {
    title: string;
    notNull: boolean;
    desc: string;
    $value: any;
    $viewValue: any;
    $tempValue: any;
    type: EditType;
    show: boolean;
    readOnly: boolean;
    sort: number;
    group: string;
    groupIcon: string;
    col: number;
    tabType: Array<TabType> | any;
    inputType: Array<InputType>;
    referenceType: Array<ReferenceType>;
    boolType: Array<BoolType>;
    choiceType: Array<ChoiceType>;
    dictType: Array<DictType>;
    dateType: Array<DateType>;
    search: Search;
}


interface Search {
    isSearch: boolean;
    isFuzzy: boolean;
    range: boolean;
}

export interface TabType {
    icon: string;
    views: Array<View>;
    eruptFieldModels: Array<EruptFieldModel>;
}


//Edit Type
interface InputType {
    type: InputEnum;
    length: number;
    placeholder: string;
    defaultVal: string;
    icon: string;
}

export interface ReferenceType {
    id: string;
    label: string;
    filter?: string;
}

interface BoolType {
    trueText: string;
    falseText: string;
    defaultValue: boolean;
}

interface ChoiceType {
    type: ChoiceEnum;
    vl: Array<VL>;
    //在页面初始化时将vl值转化成map形式
    vlMap?: Map<string, string>;
}

interface DictType {
    dictCode: string;
}

interface DateType {
    type: DateEnum;
    isRange: boolean;
}


export interface VL {
    value: number;
    label: string;
}
