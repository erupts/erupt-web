/**
 * Created by liyuepeng on 10/17/18.
 */
import {WindowModel} from "@shared/model/window.model";

export class RestPath {
    public static erupt: string = WindowModel.domain + "erupt-api";
    public static tpl: string = RestPath.erupt + "/tpl";
    public static build: string = RestPath.erupt + "/build";
    public static data: string = RestPath.erupt + "/data";
    public static comp: string = RestPath.erupt + "/comp";
    public static excel: string = RestPath.erupt + "/excel";
    public static file: string = RestPath.erupt + "/file";
    public static eruptAttachment: string = WindowModel.domain + "/erupt-attachment";
    public static bi: string = RestPath.erupt + "/bi";
}

export enum EditType {
    INPUT = "INPUT",                           //输入框
    NUMBER = "NUMBER",
    TEXTAREA = "TEXTAREA",                     //大文本域
    CHOICE = "CHOICE",                         //选择框
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
    EMPTY = "EMPTY",
    TPL = "TPL",
    HTML_EDITOR = "HTML_EDITOR",
    MAP = "MAP",
    CODE_EDITOR = "CODE_EDITOR",
}

export enum TabEnum {
    TABLE = "TABLE",
    TREE = "TREE",
    LIST_SELECT = "LIST_SELECT",
}

export enum HtmlEditTypeEnum {
    CKEDITOR = "CKEDITOR",
    UEDITOR = "UEDITOR",
    // MARKDOWN = "MARKDOWN"
}

export enum ViewType {
    TEXT = "TEXT",
    LINK = "LINK",
    LINK_DIALOG = "LINK_DIALOG",
    IMAGE = "IMAGE",
    SWF = "SWF",
    DOWNLOAD = "DOWNLOAD",
    ATTACHMENT_DIALOG = "ATTACHMENT_DIALOG",
    ATTACHMENT = "ATTACHMENT",
    QR_CODE = "QR_CODE",
    MAP = "MAP",
    CODE = "CODE",
    HTML = "HTML",
    DATE = "DATE",
    BOOLEAN = "BOOLEAN",
    NUMBER = "NUMBER"
}

export enum DateEnum {
    DATE = "DATE",
    TIME = "TIME",
    DATE_TIME = "DATE_TIME",
    WEEK = "WEEK",
    MONTH = "MONTH",
    YEAR = "YEAR"
}

export enum AttachmentEnum {
    IMAGE = "IMAGE",
    OTHER = "OTHER",
}

export enum ChoiceEnum {
    RADIO = "RADIO",
    CHECKBOX = "CHECKBOX",
    SELECT_SINGLE = "SELECT_SINGLE",
    SELECT_MULTI = "SELECT_MULTI",
    TAGS = "TAGS"
}


export enum SaveMode {
    SINGLE_COLUMN = "SINGLE_COLUMN",
    MULTI_ROW = "MULTI_ROW"
}

export enum SelectMode {
    checkbox = "checkbox",
    radio = "radio"
}

export enum OperationMode {
    SINGLE = "SINGLE", MULTI = "MULTI", BUTTON = "BUTTON"
}
