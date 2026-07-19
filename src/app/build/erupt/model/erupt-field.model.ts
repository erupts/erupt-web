import {AttachmentEnum, ChoiceEnum, DateEnum, EditType, HtmlEditTypeEnum, MultiChoiceEnum, PickerMode, TabEnum, ViewType} from "./erupt.enum";
import {QueryExpression} from "./erupt.vo";
import {KeyValueDiffer} from "@angular/core";
import {Subject} from "rxjs";


export interface EruptFieldModel {
    fieldName: string;
    fieldReturnName: string;
    eruptFieldJson: EruptField;
    choiceMap?: Map<String, VL>;
    choiceLabelMap?: Map<String, VL>;
    componentValue?: any;
    value?: any;
}


//field detail
export interface EruptField {
    views?: View[];
    edit?: Edit;
}

export interface Tpl {
    path: string;
    enable: boolean;
    width: string;
    height: string;
    openWay: OpenWay;
    embedType: PageEmbedType
    drawerPlacement: DrawerPlacement;
}

export enum PageEmbedType {
    IFRAME = "IFRAME",
    MICRO_FRONTEND = "MICRO_FRONTEND"
}

export enum OpenWay {
    MODAL = "MODAL",
    DRAWER = "DRAWER",
    ROUTER = "ROUTER"
}

export enum DrawerPlacement {
    LEFT = "LEFT",
    RIGHT = "RIGHT",
    TOP = "TOP",
    BOTTOM = "BOTTOM"
}

export enum FormCtrl {
    HIDE = "HIDE",
    SHOW = "SHOW",
    NOTNULL = "NOTNULL",
    READONLY = "READONLY",
}

export interface View {
    className: string;
    column: string;
    title: string;
    width: string;
    desc: string;
    show: boolean;
    type: ViewType;
    template: string;
    sortable: boolean;
    tpl: Tpl;
    //extra
    eruptFieldModel?: EruptFieldModel;
}

export interface Edit {
    title: string;
    notNull: boolean;
    desc: string;
    type: EditType;
    show: boolean;
    dynamic: { dependField: string, condition: string, noMatch: FormCtrl, match: FormCtrl };
    onchange: string;
    readOnly: Readonly;
    placeHolder: string;
    search: Search;
    tabType?: TabType;
    inputType?: InputType;
    numberType?: NumberType;
    referenceTreeType?: ReferenceTreeType;
    referenceTableType?: ReferenceTableType;
    attachmentType?: AttachmentType;
    autoCompleteType?: AutoCompleteType;
    htmlEditorType?: HtmlEditorType;
    rateType?: RateType;
    boolType?: BoolType;
    choiceType?: ChoiceType;
    multiChoiceType?: MultiChoiceType;
    tagsType?: TagsType;
    dateType?: DateType;
    sliderType?: SliderType;
    codeEditType?: CodeEditType;
    mapType?: MapType;
    groupType?: GroupType;
    calloutType?: CalloutType;
    buttonType?: ButtonType;
    $tabTreeViewData?: any;

    $valueDiff?: KeyValueDiffer<any, any>;
    $valueSubject?: Subject<any>
    $value?: any;

    $viewValue?: any;
    $tempValue?: any;
    $beforeValue?: any;
    $l_val?: any;
    $r_val?: any;
    $operator?: QueryExpression;
}

interface Readonly {
    add: boolean;
    edit: boolean;
}

interface HtmlEditorType {
    value: HtmlEditTypeEnum;
}

interface RateType {
    character: string;
    allowHalf: string;
    count: number;
}

interface Search {
    value: boolean;
    notNull: boolean;
    operator?: QueryExpression;
}

interface CodeEditType {
    language: string;
    height: number;
    hintHandler?: string[];
}

//Edit Type
interface InputType {
    length: number;
    type: string;
    fullSpan: boolean;
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
    expandLevel: number;
}

export interface ReferenceTableType {
    id: string;
    label: string;
    dependField: string;
}

interface BoolType {
    trueText: string;
    falseText: string;
}

interface ChoiceType {
    type: ChoiceEnum;
    dependField: string;
    items: VL[],
    trigger: string;
    fetchHandler: string[];

    onVLChange(value, oldValue): void;
}

interface MultiChoiceType {
    type: MultiChoiceEnum;
    dependField: string;
}

interface TagsType {
    allowExtension: boolean;
    joinSeparator: string;
    maxTagCount: number;
    fetchHandler: string[];
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
    pickerMode: PickerMode;
    isRange: boolean;
}

interface AttachmentType {
    size: number;
    fileTypes: string[];
    path: String;
    maxLimit: number;
    type: AttachmentEnum;
    fileSeparator: string;
    baseUrl: { value: string };
}

export interface MapType {
    draw: boolean;
    drawMaxLayer: number;
}

interface GroupType {
    fields: string[];
    collapsed: boolean;
}

export interface CalloutType {
    value: string;
    style: "CARD" | "INFO" | "SUCCESS" | "WARNING" | "ERROR";
}

export interface ButtonType {
    style: "default" | "primary" | "dashed" | "link" | "text";
    danger: boolean;
    icon: string;
    confirm: string;
    fullSpan: boolean;
}

export interface VL {
    value: string;
    label: string;
    color?: string;
    desc?: string;
    disable?: boolean;
}
