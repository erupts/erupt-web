import {
    AttachmentEnum,
    ChoiceEnum,
    DateEnum,
    DependSwitchTypeEnum,
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
    choiceMap?: Map<String, String>
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
    readOnly: boolean;
    placeHolder: string;
    search: Search;
    tabType: TabType;
    inputType: InputType;
    numberType: NumberType;
    referenceTreeType: ReferenceTreeType;
    referenceTableType: ReferenceTableType;
    attachmentType: AttachmentType;
    boolType: BoolType;
    choiceType: ChoiceType;
    dateType: DateType;
    sliderType: SliderType;
    dependSwitchType: DependSwitchType;
    codeEditType: CodeEditType;
    $tabTreeViewData?: any;
    $value?: any;
    $viewValue?: any;
    $tempValue?: any;
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
    prefix: VL[];
    suffix: VL[];
    prefixValue?: string;
    suffixValue?: string;
}

interface NumberType {
    min: number;
    max: number;
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

interface DependSwitchType {
    reject: boolean;
    attr: DependSwitchAttr[]
    type: DependSwitchTypeEnum;
    view: DependSwitchViewEnum;
}

enum DependSwitchViewEnum {
    RADIO = "RADIO",
    SELECT = "SELECT"
}


interface DependSwitchAttr {
    value: number;
    label: string;
    dependEdits: string[]
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
}


export interface VL {
    value: string;
    label: string;
    $viewValue?: any;
}
