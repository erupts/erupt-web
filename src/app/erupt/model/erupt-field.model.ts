import { AttachmentEnum, ChoiceEnum, DateEnum, EditType, SaveMode, TabEnum, ViewType } from "./erupt.enum";

/**
 * Created by liyuepeng on 10/17/18.
 */
export interface EruptFieldModel {
  fieldName: string;
  eruptFieldJson: EruptField;
  fieldReturnName?: string;
  value?: any;
}


//field detail
export interface EruptField {
  views?: Array<View>;
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
  sort: number;
  group: string;
  groupIcon: string;
  col: number;
  tabType: Array<TabType>;
  inputType: InputType;
  referenceTreeType: Array<ReferenceTreeType>;
  attachmentType: Array<AttachmentType>;
  boolType: Array<BoolType>;
  choiceType: Array<ChoiceType>;
  dictType: Array<DictType>;
  dateType: Array<DateType>;
  sliderType: Array<SliderType>;
  dependSwitchType: Array<DependSwitchType>
  search: Search;
  $value?: any;
  $viewValue?: any;
  $tempValue?: any;
  $l_val?: any;
  $r_val?: any;
  $statusValue?: boolean;
}


interface Search {
  value: boolean;
  vague: boolean;
}


//Edit Type
interface InputType {
  length: number;
  placeholder: string;
  prefix: Array<VL>;
  suffix: Array<VL>;
  prefixValue?: string;
  suffixValue?: string;
}

export interface ReferenceTreeType {
  id: string;
  label: string;
  pid: string;
  depend: string;
  filter?: string;
}

interface BoolType {
  trueText: string;
  falseText: string;
  defaultValue: boolean;
}

interface ChoiceType {
  type: ChoiceEnum;
  vl: Array<VL>;
  joinSeparator: string;
  //在页面初始化时将vl值转化成map形式
  vlMap?: Map<string, string>;
}

export interface TabType {
  type: TabEnum;
}

interface DependSwitchType {
  reject: boolean;
  dependSwitchAttrs: DependSwitchAttr[]
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
  marks?: any;
}

interface DictType {
  dictCode: string;
}

interface DateType {
  type: DateEnum;
  isRange: boolean;
}

interface AttachmentType {
  size: number;
  fileType: string[];
  path: String;
  maxLimit: number;
  type: AttachmentEnum;
  fileSeparator: string;
  saveMode:SaveMode;
}


export interface VL {
  value: string;
  label: string;
}
