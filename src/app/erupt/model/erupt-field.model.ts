import { ChoiceEnum, DateEnum, EditType, InputEnum, ViewType } from "./erupt.enum";
import { EruptModel } from "./erupt.model";

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
  inputType: Array<InputType>;
  referenceType: Array<ReferenceType>;
  boolType: Array<BoolType>;
  choiceType: Array<ChoiceType>;
  dictType: Array<DictType>;
  dateType: Array<DateType>;
  sliderType: Array<SliderType>;
  search: Search;

  $value?: any;
  $viewValue?: any;
  $tempValue?: any;
}


interface Search {
  search: boolean;
  vague: boolean;
}

export interface TabType {
  icon: string;
  views: Array<View>;
  // eruptFieldModels: Array<EruptFieldModel>;
}


//Edit Type
interface InputType {
  type: InputEnum;
  length: number;
  placeholder: string;
  defaultVal: string;
  icon: string;
}

export interface ReferenceType {
  id: string;
  label: string;
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
  //在页面初始化时将vl值转化成map形式
  vlMap?: Map<number, string>;
}

interface SliderType {
  min: number;
  max: number;
}

interface DictType {
  dictCode: string;
}

interface DateType {
  type: DateEnum;
  isRange: boolean;
}


export interface VL {
  value: number;
  label: string;
}

