import {Edit, EruptFieldModel, View} from "./erupt-field.model";
import {OperationMode, OperationType} from "./erupt.enum";

/**
 * Created by liyuepeng on 10/16/18.
 */
export interface EruptModel {
    eruptFieldModels: EruptFieldModel[];
    eruptJson: Erupt;
    eruptName: string;
    //# customer prop
    eruptFieldModelMap?: Map<String, EruptFieldModel>;
    tableColumns?: View[];
    mode?: "edit" | "search";
}

export interface Erupt {
    primaryKeyCol: string;
    power: Power;
    tree: Tree;
    linkTree: LinkTree;
    rowOperation: { [key: string]: RowOperation };
    drills: { [key: string]: Drill }
}

interface LinkTree {
    field: string
    dependNode: boolean
    value: any;
}

export interface Drill {
    code: string;
    title: string;
    icon: string;
    column: string;
    link: Link;
}

export interface Tree {
    id: string;
    label: string;
    pid: string;
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
    icon: string;
    title: string;
    mode: OperationMode;
    type: OperationType;
    tip: string;
    ifExpr: string;
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
