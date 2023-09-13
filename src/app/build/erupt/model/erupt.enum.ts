import {WindowModel} from "@shared/model/window.model";

export class RestPath {
    public static erupt: string = WindowModel.domain + "erupt-api";
    public static eruptApp: string = RestPath.erupt + "/erupt-app";
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
}

export enum EditType {
    INPUT = "INPUT",                           //输入框
    NUMBER = "NUMBER",
    TEXTAREA = "TEXTAREA",                     //大文本域
    CHOICE = "CHOICE",                         //选择框
    TAGS = "TAGS",                             //标签选择
    DATE = "DATE",                             //日期
    COMBINE = "COMBINE",                       //表格合并
    REFERENCE_TABLE = "REFERENCE_TABLE",       //引用
    REFERENCE_TREE = "REFERENCE_TREE",         //引用
    BOOLEAN = "BOOLEAN",                       //布尔
    ATTACHMENT = "ATTACHMENT",                 //附件
    AUTO_COMPLETE = "AUTO_COMPLETE",           //自动完成
    TAB_TREE = "TAB_TREE",
    TAB_TABLE_ADD = "TAB_TABLE_ADD",
    TAB_TABLE_REFER = "TAB_TABLE_REFER",
    DIVIDE = "DIVIDE",                         //分割线
    SLIDER = "SLIDER",                         //数字滑块
    RATE = "RATE",
    CHECKBOX = "CHECKBOX",
    EMPTY = "EMPTY",
    TPL = "TPL",
    MARKDOWN = "MARKDOWN",
    HTML_EDITOR = "HTML_EDITOR",
    MAP = "MAP",
    CODE_EDITOR = "CODE_EDITOR",
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
    HIDDEN = "HIDDEN"
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
    FUTURE = "FUTURE",  //仅可选择未来时间
    HISTORY = "HISTORY"  //仅可选择历史时间
}

export enum AttachmentEnum {
    IMAGE = "IMAGE",
    BASE = "BASE",
}

export enum ChoiceEnum {
    RADIO = "RADIO",
    SELECT = "SELECT",
}

export enum SelectMode {
    checkbox = "checkbox",
    radio = "radio"
}

export enum OperationMode {
    SINGLE = "SINGLE", MULTI = "MULTI", BUTTON = "BUTTON"
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
    //后端分页
    BACKEND = "BACKEND",
    //前端分页
    FRONT = "FRONT",
    //不分页
    NONE = "NONE"
}
