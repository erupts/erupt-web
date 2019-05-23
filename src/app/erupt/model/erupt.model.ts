import { Edit, EruptFieldModel, View } from "./erupt-field.model";

/**
 * Created by liyuepeng on 10/16/18.
 */
export interface EruptModel {
  eruptFieldModels: Array<EruptFieldModel>;
  eruptJson: Erupt;
  eruptName: string;
  //# customer prop
  eruptFieldModelMap?: Map<String, EruptFieldModel>;
  tableColumns?: Array<View>;
  mode?: "edit" | "search";
  //计算tab加载完成情况TODO delete
  tabLoadCount?: number;
}

export interface Erupt {
  name: string;
  primaryKeyCol: string;
  power: Power;
  desc: string;
  tree: Tree;
  rowOperation: Array<RowOperation>;
  rowOperationMap?: Map<String, RowOperation>;
}

export interface Tree {
  id: string;
  label: string;
  children?: Array<Tree>;
  data?: any;
}


interface RowOperation {
  code: string;
  icon: string;
  title: string;
  multi: boolean;
  edits: Array<CodeAndEdit>;
}

interface CodeAndEdit {
  edit: Edit;
  codeType: string;
  code: string;
}

interface Power {
  add: boolean;
  delete: boolean;
  edit: boolean;
  query: boolean;
  viewDetails: boolean;
  importable: boolean;
  export: boolean;
}
