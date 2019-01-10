/**
 * Created by liyuepeng on 10/17/18.
 */
export enum UiColor {
  DEFAULT, primary, success, info, warning, danger, inverse
}

export enum RgbColor {
  not, yellow, green, red, blue, white, black
}

export enum EditType {
  INPUT = "INPUT",                 //输入框
  CHOICE = "CHOICE",               //选择框
  DATE = "DATE",                   //日期
  REFERENCE = "REFERENCE",         //引用
  BOOLEAN = "BOOLEAN",             //布尔
  IMAGE = "IMAGE",                 //图片
  ATTACHMENT = "ATTACHMENT",       //附件
  TAB = "TAB",                     //TAB选项卡
  MARK_DOWN = "MARK_DOWN",         //mark down
  DIVIDE = "DIVIDE",
  SLIDER = "SLIDER"               //数字滑块
}

export enum ViewType {
  TEXT = "TEXT",
  QR_CODE = "QR_CODE",
  LINK = "LINK"
}

export enum DateEnum {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR"
}

export enum InputEnum {
  TEXT, EMAIL, TEXTAREA, TAG
}

export enum ChoiceEnum {
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  SELECT_SINGLE = "SELECT_SINGLE",
  SELECT_MULTI = "SELECT_MULTI"
}

