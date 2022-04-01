import {Waterfall} from "@antv/g2plot";

export interface Bi {
    id: number;
    code: string;
    export: boolean;
    refreshTime: number;
    table: boolean;
    pageType: pageType;
    dimensions: Dimension[];
    charts: Chart[];
}

export interface Chart {
    id: number;
    code: string;
    name: string;
    grid: number;
    height: number;
    type: ChartType;
    linkage: boolean;
    option: object;
    chartOption: any;
    loading?: boolean;
}

export enum ChartType {
    Line = "Line",
    StepLine = "StepLine",
    Bar = "Bar",
    PercentStackedBar = "PercentStackedBar",
    Area = "Area",
    PercentageArea = "PercentageArea",
    Column = "Column",
    Waterfall = "Waterfall",
    StackedColumn = "StackedColumn",
    Pie = "Pie",
    Ring = "Ring",
    Rose = "Rose",
    Scatter = "Scatter",
    Radar = "Radar",
    WordCloud = "WordCloud",
    Funnel = "Funnel",
    Bubble = "Bubble",


    //TODO 当前g2plot版本还不支持
    Heatmap = "Heatmap",
    DensityHeatmap = "DensityHeatmap",
    Treemap = "Treemap",

    tpl = "tpl",

    table = "table"
}


export enum pageType {
    'backend' = "backend",
    'front' = 'front',
    'none' = 'none'
}

export interface Dimension {
    id: number;
    code: string;
    title: string;
    type: DimType;
    vague: boolean;
    notNull: boolean;
    dependDimension: string;
    $value: any;
    $viewValue?: any;
    defaultValue: any;
}

export enum DimType {
    INPUT = "INPUT",
    TAG = "TAG",
    NUMBER = "NUMBER",
    NUMBER_RANGE = "NUMBER_RANGE",
    DATE = "DATE",
    DATE_RANGE = "DATE_RANGE",
    DATETIME = "DATETIME",
    DATETIME_RANGE = "DATETIME_RANGE",
    TIME = "TIME",
    WEEK = 'WEEK',
    MONTH = "MONTH",
    YEAR = "YEAR",

    REFERENCE = "REFERENCE",
    REFERENCE_CASCADE = "REFERENCE_CASCADE",
    REFERENCE_MULTI = "REFERENCE_MULTI",
    REFERENCE_TREE_RADIO = "REFERENCE_TREE_RADIO",
    REFERENCE_TREE_MULTI = "REFERENCE_TREE_MULTI",
    REFERENCE_RADIO = "REFERENCE_RADIO",
    REFERENCE_CHECKBOX = "REFERENCE_CHECKBOX"
}

export interface BiData {
    columns: Column[];
    list: any;
    total: number;
}

export interface Column {
    name: string;
    width: number;
    sortable: boolean;
    display: boolean;
}

export interface Reference {
    id: string,
    title: string,
    pid?: string,
    children?: Reference[],
    isLeaf?: boolean,
    // [key: string]: any
}
