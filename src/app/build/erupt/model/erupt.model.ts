import {EruptFieldModel, Tpl, View} from "./erupt-field.model";
import {FormSize, OperationIfExprBehavior, OperationMode, OperationType, PagingType} from "./erupt.enum";


export interface EruptModel {
    eruptFieldModels: EruptFieldModel[];
    eruptJson: Erupt;
    eruptName: string;
    extraRow: boolean;
    //# customer prop
    eruptFieldModelMap?: Map<String, EruptFieldModel>;
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
}

export interface CardView {
    galleryField: string;
    galleryCover: GalleryCover;
    viewFields: string[];
}

export interface DrillInput {
    eruptParent: string,
    code: string,
    erupt: string,
    val: any
}

export enum GalleryCover {
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
    tip: string;
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
