import {WindowModel} from "@shared/model/window.model";

export class RestPath {
    public static erupt: string = WindowModel.domain + "erupt-api";
    public static eruptApp: string = RestPath.erupt + "/erupt-app";
    public static domainInfo: string = RestPath.erupt + "/tenant/domain-info";
    public static tpl: string = RestPath.erupt + "/tpl";
    public static build: string = RestPath.erupt + "/build";
    public static data: string = RestPath.erupt + "/data";
    public static component: string = RestPath.erupt + "/comp";
    public static dataModify: string = RestPath.data + "/modify";
    public static comp: string = RestPath.erupt + "/comp";
    public static excel: string = RestPath.erupt + "/excel";
    public static file: string = RestPath.erupt + "/file";
    public static eruptAttachment: string = WindowModel.domain + "erupt-attachment";
    public static bi: string = RestPath.erupt + "/bi";
    public static formView: string = RestPath.erupt + "/data/form-view";
}

export enum EditType {
    INPUT = "INPUT",                           //input field
    NUMBER = "NUMBER",
    COLOR = "COLOR",
    TEXTAREA = "TEXTAREA",                     //large text area
    CHOICE = "CHOICE",                         //single selection
    MULTI_CHOICE = "MULTI_CHOICE",             //multiple selection
    TAGS = "TAGS",                             //tag selection
    DATE = "DATE",                             //date
    COMBINE = "COMBINE",                       //table merge
    REFERENCE_TABLE = "REFERENCE_TABLE",       //reference
    REFERENCE_TREE = "REFERENCE_TREE",         //reference
    BOOLEAN = "BOOLEAN",                       //boolean
    ATTACHMENT = "ATTACHMENT",                 //attachment
    AUTO_COMPLETE = "AUTO_COMPLETE",           //auto complete
    TAB_TREE = "TAB_TREE",
    TAB_TABLE_ADD = "TAB_TABLE_ADD",
    TAB_TABLE_REFER = "TAB_TABLE_REFER",
    DIVIDE = "DIVIDE",                         //divider
    SLIDER = "SLIDER",                         //numeric slider
    RATE = "RATE",
    CHECKBOX = "CHECKBOX",
    EMPTY = "EMPTY",
    TPL = "TPL",
    MARKDOWN = "MARKDOWN",
    HTML_EDITOR = "HTML_EDITOR",
    MAP = "MAP",
    CODE_EDITOR = "CODE_EDITOR",
    SIGNATURE = "SIGNATURE",
}

export enum Scene {
    ADD = "add",
    EDIT = "edit",
    VIEW = "view"
}

export enum TabEnum {
    TABLE = "TABLE",
    TREE = "TREE",
    LIST_SELECT = "LIST_SELECT",
}

export enum HtmlEditTypeEnum {
    CKEDITOR = "CKEDITOR",
    UEDITOR = "UEDITOR",
}

export enum ViewType {
    TEXT = "TEXT",
    COLOR = "COLOR",
    SAFE_TEXT = "SAFE_TEXT",
    LINK = "LINK",
    TAB_VIEW = "TAB_VIEW",
    LINK_DIALOG = "LINK_DIALOG",
    IMAGE = "IMAGE",
    IMAGE_BASE64 = "IMAGE_BASE64",
    SWF = "SWF",
    DOWNLOAD = "DOWNLOAD",
    ATTACHMENT_DIALOG = "ATTACHMENT_DIALOG",
    ATTACHMENT = "ATTACHMENT",
    MOBILE_HTML = "MOBILE_HTML",
    QR_CODE = "QR_CODE",
    MAP = "MAP",
    CODE = "CODE",
    HTML = "HTML",
    DATE = "DATE",
    DATE_TIME = "DATE_TIME",
    BOOLEAN = "BOOLEAN",
    NUMBER = "NUMBER",
    MARKDOWN = "MARKDOWN",
    HIDDEN = "HIDDEN",
}

export enum DateEnum {
    DATE = "DATE",
    TIME = "TIME",
    DATE_TIME = "DATE_TIME",
    WEEK = "WEEK",
    MONTH = "MONTH",
    YEAR = "YEAR"
}

export enum PickerMode {
    ALL = "ALL",
    FUTURE = "FUTURE",  //only future dates are selectable
    HISTORY = "HISTORY"  //only past dates are selectable
}

export enum AttachmentEnum {
    IMAGE = "IMAGE",
    BASE = "BASE",
}

export enum ChoiceEnum {
    RADIO = "RADIO",
    SELECT = "SELECT",
}

export enum MultiChoiceEnum {
    SELECT = "SELECT",
    CHECKBOX = "CHECKBOX"
}

export enum SelectMode {
    checkbox = "checkbox",
    radio = "radio"
}

export enum OperationMode {
    SINGLE = "SINGLE", MULTI = "MULTI", BUTTON = "BUTTON", MULTI_ONLY = "MULTI_ONLY"
}

export enum OperationType {
    ERUPT = "ERUPT", TPL = "TPL",
}

export enum OperationIfExprBehavior {
    HIDE = "HIDE", DISABLE = "DISABLE",
}


export enum FormSize {
    DEFAULT = "DEFAULT",
    FULL_LINE = "FULL_LINE"
}

export enum PagingType {
    //backend pagination
    BACKEND = "BACKEND",
    //frontend pagination
    FRONT = "FRONT",
    //no pagination
    NONE = "NONE"
}

export enum SortType {
    ASC = "ASC",
    DESC = "DESC",
}

export enum TableSize {
    SMALL = "small",
    MIDDLE = "middle",
    DEFAULT = "default",
}
