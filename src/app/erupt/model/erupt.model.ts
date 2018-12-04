import {Edit, EruptFieldModel, View} from "./erupt-field.model";
import {RgbColor} from "./erupt.enum";
/**
 * Created by liyuepeng on 10/16/18.
 */
export interface EruptModel {
    eruptFieldModels: Array<EruptFieldModel>;
    eruptJson: Erupt;
    eruptName: string;
    primaryKeyCol: string;
    //# customer prop
    tableColumns?: Array<View>;
    subEruptModels?: Array<EruptModelAndField>;
}

export interface Erupt {
    name: string;
    power: Power;
    desc: string;
    tree: Tree;
    cards: Array<Card>;
    rowOperation: Array<RowOperation>;
    rowOperationMap?: Map<String, RowOperation>;
}

export interface Tree {
    id: string;
    label: string;
    children: Array<Tree>;
    data: any;
}

interface EruptModelAndField {
    eruptModel: EruptModel;
    eruptField: EruptFieldModel;
    columns?: Array<any>;
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
    del: boolean;
    edit: boolean;
    query: boolean;
    export: boolean;
    importable: boolean;
}

interface Card {
    icon: string;
    value: string;
    desc: string;
    color: RgbColor;
}
