import {EruptFieldModel, Tpl, View} from "./erupt-field.model";
import {FormSize, OperationIfExprBehavior, OperationMode, OperationType, PagingType, SortType} from "./erupt.enum";


export interface EruptModel {
    eruptFieldModels: EruptFieldModel[];
    eruptJson: Erupt;
    eruptName: string;
    extraRow: boolean;
    //# customer prop
    eruptFieldModelMap?: Map<String, EruptFieldModel>;
    tags?: Map<String, object>;
    tableColumns?: View[];
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
    layout: Layout;
    visRawTable: boolean;
    vis: Vis[];
}

export interface Vis {
    code: string;
    title: string;
    desc: string;
    fields: string[];
    type: VisType;
    cardView: CardView;
    ganttView: GanttView;
    tplView: Tpl
}

export enum VisType {
    TABLE = "TABLE",
    GANTT = "GANTT",
    CARD = "CARD",
    BOARD = "BOARD",
    TPL = "TPL"
}

export interface CardView {
    coverField: string;
    coverEffect: CoverEffect;
    viewFields: string[];
}

export interface GanttView {

    startDateField: string;

    endDateField: string;

    pidField: string;

    colorField: string;

    progressField: string;

    groupField: string;

}

export interface DrillInput {
    eruptParent: string,
    code: string,
    erupt: string,
    val: any
}

export enum CoverEffect {
    FIT = "FIT", //适应
    CLIP = "CLIP", //剪裁
}

interface Layout {
    formSize: FormSize;
    pagingType: PagingType;
    tableLeftFixed: number;
    tableRightFixed: number;
    pageSize: number;
    pageSizes: number[];
    refreshTime: number;
    tableWidth: string;
    tableOperatorWidth: string;
}


interface LinkTree {
    field: string;
    dependNode: boolean;
    value: string[];
}

export interface Drill {
    code: string;
    title: string;
    fold: boolean;
    icon: string;
    column: string;
    link: Link;
}

export interface Page {
    pageIndex: number;
    pageSize: number;
    vis: string;
    totalPage?: number;
    total?: number;
    sort?: Sort[];
    list?: any[];
    alert?: Alert;
}

export interface Sort {
    field: string;
    direction?: SortType;
}

export interface Alert {
    message: string;
    closeable: boolean;
    uiType: "success" | "info" | "warning" | "error";
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
    remark: any
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
    fold: boolean;
    tip: string;
    callHint: string;
    ifExpr: string;
    ifExprBehavior: OperationIfExprBehavior;
    tpl: Tpl;
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
