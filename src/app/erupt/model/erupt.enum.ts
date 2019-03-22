/**
 * Created by liyuepeng on 10/17/18.
 */

export class RestPath {
  public static DONT_INTERCEPT: string = window["domain"] + "/ws/";
  public static erupt: string = window["domain"] + "/erupt-api";
  public static build: string = RestPath.erupt + "/build/";
  public static data: string = RestPath.erupt + "/data/";
  public static excel: string = RestPath.erupt + "/excel/";
  public static file: string = RestPath.erupt + "/file/";
  public static NO_RIGHT_SYMBOL: string = "__";
}

export enum EditType {
  INPUT = "INPUT",                 //输入框
  CHOICE = "CHOICE",               //选择框
  DATE = "DATE",                   //日期
  REFERENCE = "REFERENCE",         //引用
  BOOLEAN = "BOOLEAN",             //布尔
  ATTACHMENT = "ATTACHMENT",       //附件
  TAB = "TAB",                     //TAB选项卡
  DIVIDE = "DIVIDE",               //分割线
  SLIDER = "SLIDER",               //数字滑块
  EMPTY = "EMPTY",
  DEPEND_SWITCH = "DEPEND_SWITCH",
  HTML_EDIT = "HTML_EDIT"
}

export enum TabEnum {
  TABLE = "TABLE",
  TREE = "TREE",
  LIST_SELECT = "LIST_SELECT",
}

export enum ViewType {
  TEXT = "TEXT",
  QR_CODE = "QR_CODE",
  LINK = "LINK",
  IMAGE = "IMAGE",
  ATTACHMENT = "ATTACHMENT"
}

export enum DateEnum {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR"
}

export enum InputEnum {
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA"
}

export enum AttachmentEnum {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  OTHER = "OTHER",
}

export enum ChoiceEnum {
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  SELECT_SINGLE = "SELECT_SINGLE",
  SELECT_MULTI = "SELECT_MULTI"
}

