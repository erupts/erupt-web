import {
    AttachmentEnum,
    ChoiceEnum,
    DateEnum,
    EditType,
    SaveMode,
    TabEnum,
    ViewType
} from "./erupt.enum";

/**
 * Created by liyuepeng on 10/17/18.
 */
export interface EruptFieldModel {
    fieldName: string;
    eruptFieldJson: EruptField;
    choiceList?: VL[]
    value?: any;
}


//field detail
export interface EruptField {
    views?: View[];
    edit?: Edit;
}

export interface View {
    className: string;
    column: string;
    title: string;
    desc: string;
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
    type: EditType;
    show: boolean;
    showBy: { dependField: string, expr: string };
    readOnly: boolean;
    placeHolder: string;
    search: Search;
    tabType: TabType;
    inputType: InputType;
    numberType: NumberType;
    referenceTreeType: ReferenceTreeType;
    referenceTableType: ReferenceTableType;
    attachmentType: AttachmentType;
    autoCompleteType: AutoCompleteType;
    boolType: BoolType;
    choiceType: ChoiceType;
    dateType: DateType;
    sliderType: SliderType;
    codeEditType: CodeEditType;
    mapType: MapType
    $tabTreeViewData?: any;
    $value?: any;
    $viewValue?: any;
    $tempValue?: any;
    $beforeValue?: any;
    $l_val?: any;
    $r_val?: any;
}

interface Search {
    value: boolean;
    vague: boolean;
    notNull: boolean;
}

interface CodeEditType {
    language: string;
}

//Edit Type
interface InputType {
    length: number;
    type: string;
    prefix: VL[];
    suffix: VL[];
    prefixValue?: string;
    suffixValue?: string;
}

interface NumberType {
    min: number;
    max: number;
}

interface AutoCompleteType {
    items: any[];
    triggerLength: number;
}

export interface ReferenceTreeType {
    id: string;
    label: string;
    pid: string;
    dependField: string;
}

export interface ReferenceTableType {
    id: string;
    label: string;
    dependField: string;
}

interface BoolType {
    trueText: string;
    falseText: string;
    defaultValue: boolean;
}

interface ChoiceType {
    type: ChoiceEnum;
    vl: VL[];
    joinSeparator: string;
}

export interface TabType {
    type: TabEnum;
}


interface SliderType {
    min: number;
    max: number;
    step: number;
    markPoints: number[];
    dots: boolean;
    marks?: any;
}

interface DateType {
    type: DateEnum;
    isRange: boolean;
}

interface AttachmentType {
    size: number;
    fileTypes: string[];
    path: String;
    maxLimit: number;
    type: AttachmentEnum;
    fileSeparator: string;
    saveMode: SaveMode;
    baseUrl: { value: string }
}

export interface MapType {
    draw: boolean;
    drawMaxLayer: number;
}

export interface VL {
    value: string;
    label: string;
    $viewValue?: any;
}
