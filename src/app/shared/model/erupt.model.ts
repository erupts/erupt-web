import {Edit, EruptFieldModel, View} from "./erupt-field.model";

export interface EruptBuildModel {
  eruptModel: EruptModel;
  power?: Power;
  tabErupts?: { [key: string]: EruptBuildModel };
  combineErupts?: { [key: string]: EruptModel };
  referenceErupts?: { [key: string]: EruptModel };
  operationErupts?: { [key: string]: EruptModel };
}

export interface EruptAndEruptFieldModel {
  eruptModel: EruptModel;
  eruptFieldModel: EruptFieldModel;
  alainTableConfig?: any[];
}

export interface EruptModel {
  eruptFieldModels: EruptFieldModel[];
  eruptJson: Erupt;
  eruptName: string;
  extraRow: boolean;
  //# customer prop
  eruptFieldModelMap?: Map<String, EruptFieldModel>;
  tableColumns?: View[];
  mode?: "edit" | "search";
  searchCondition: any;
}

export interface Erupt {
  primaryKeyCol: string;
  desc: string;
  power: Power;
  tree: Tree;
  linkTree: LinkTree;
  cardView: CardView;
  rowOperation: RowOperation[];
  drills: Drill[];
}

export interface CardView {
  galleryField: string;
  galleryCover: GalleryCover;
  viewFields: string[];
}

export enum GalleryCover {
  FIT = "FIT", //适应
  CLIP = "CLIP", //剪裁
}

interface LinkTree {
  field: string;
  dependNode: boolean;
  value: any;
}

export interface Drill {
  code: string;
  title: string;
  icon: string;
  column: string;
  link: Link;
}

export interface Page {
  pageIndex: number;
  pageSize: number;
  totalPage?: number;
  total?: number;
  sort?: string;
  list?: any[];
}

export interface Tree {
  id: string;
  label: string;
  pid: string;
  expandLevel: number;
  level: number;
  linkTable: Link[];
  children?: Tree[];
  data?: any;
}

export interface Checkbox {
  id: any;
  label: any;
  checked: boolean;
}

export interface Link {
  linkErupt: string;
}


export interface RowOperation {
  code: string;
  icon: string;
  title: string;
  mode: OperationMode;
  type: OperationType;
  tip: string;
  ifExpr: string;
  tplWidth: string;
  ifExprBehavior: OperationIfExprBehavior;
}


interface CodeAndEdit {
  edit: Edit;
  codeType: string;
  code: string;
}

export interface Power {
  add: boolean;
  delete: boolean;
  edit: boolean;
  query: boolean;
  viewDetails: boolean;
  importable: boolean;
  export: boolean;
}

export interface Row {
  className?: string;
  columns: Column[];
}

export interface Column {
  className?: string;
  value: string;
  colspan?: number;
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
