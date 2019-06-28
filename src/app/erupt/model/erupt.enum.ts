/**
 * Created by liyuepeng on 10/17/18.
 */
import { WindowModel } from "../window.model";

export class RestPath {
  public static ws: string = WindowModel.domain + "/ws/";
  public static erupt: string = WindowModel.domain + "/erupt-api";
  public static build: string = RestPath.erupt + "/build/";
  public static data: string = RestPath.erupt + "/data/";
  public static excel: string = RestPath.erupt + "/excel/";
  public static file: string = RestPath.erupt + "/file/";
  public static NO_RIGHT_SYMBOL: string = "__";
}

export enum EditType {
  INPUT = "INPUT",                 //输入框
  TEXTAREA = "TEXTAREA",
  CHOICE = "CHOICE",               //选择框
  TAG = "TAG",                     //标签
  DATE = "DATE",                   //日期
  COMBINE = "COMBINE",            //表格合并
  REFERENCE_TABLE = "REFERENCE_TABLE",
  REFERENCE_TREE = "REFERENCE_TREE",         //引用
  BOOLEAN = "BOOLEAN",             //布尔
  ATTACHMENT = "ATTACHMENT",       //附件
  TAB = "TAB",                     //TAB选项卡
  DIVIDE = "DIVIDE",               //分割线
  SLIDER = "SLIDER",               //数字滑块
  EMPTY = "EMPTY",
  DEPEND_SWITCH = "DEPEND_SWITCH",
  HTML_EDIT = "HTML_EDIT",
  MAP = "MAP"
}

export enum TabEnum {
  TABLE = "TABLE",
  TREE = "TREE",
  LIST_SELECT = "LIST_SELECT",
}

export enum ViewType {
  TEXT = "TEXT",
  LINK = "LINK",
  LINK_DIALOG = "LINK_DIALOG",
  IMAGE = "IMAGE",
  SWF = "SWF",
  DOWNLOAD = "DOWNLOAD",
  ATTACHMENT_DIALOG = "DIALOG_ATTACHMENT",
  ATTACHMENT = "ATTACHMENT",
  QR_CODE = "QR_CODE",
  HTML = "HTML"
}

export enum DateEnum {
  DATE = "DATE",
  DATE_TIME = "DATE_TIME",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR"
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
  SELECT_MULTI = "SELECT_MULTI",
  TAGS = "TAGS"
}


export enum SaveMode {
  SINGLE_COLUMN = "SINGLE_COLUMN",
  MULTI_ROW = "MULTI_ROW"
}
