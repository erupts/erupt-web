import {Edit, EruptFieldModel, View} from "./erupt-field.model";

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
    rowOperation: { [key: string]: RowOperation };
    drills:  { [key: string]: Drill }
}

export interface Drill {
    code: string;
    title: string;
    icon: string;
    eruptClass: string;
}

export interface Tree {
    id: string;
    label: string;
    pid: string;
    children?: Tree[];
    data?: any;
}


interface RowOperation {
    icon: string;
    title: string;
    multi: boolean;
    edits: CodeAndEdit[];
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
