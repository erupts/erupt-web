export interface Bi {
    code: string;
    export: boolean;
    refreshTime: number;
    table: boolean;
    dimensions: Dimension[];
    charts: Chart[];
}

export interface Chart {
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
    Area = "Area",
    Column = "Column",
    Pie = "Pie",
    Ring = "Ring",
    Rose = "Rose",
    Scatter = "Scatter",
    Radar = "Radar",
    WordCloud = "WordCloud",
    Heatmap = "Heatmap",
    Funnel = "Funnel",
    Treemap = "Treemap"
}

export interface Dimension {
    code: string;
    title: string;
    type: DimType;
    vague: boolean;
    notNull: boolean;
    dependDimension: string;
    $value: any;
    $viewValue?: any;
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
    REFERENCE_MULTI = "REFERENCE_MULTI",
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
}
