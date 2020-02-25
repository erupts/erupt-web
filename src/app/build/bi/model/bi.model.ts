export interface Bi {
    code: string;
    export: boolean;
    table: boolean;
    dimensions: Dimension[];
    charts: Chart[];
}

export interface Chart {
    code: string;
    name: string;
    grid: number;
    type: ChartType;
    linkage: boolean;
    loading?: boolean;
    option: object;
    chartOption: any;
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
    type: string;
    vague: boolean;
    notNull: boolean;
    dependDimension: string;
    $value: any;
    $viewValue?: any;
}

export enum DimType {
    INPUT = "INPUT",
    NUMBER = "NUMBER",
    DATE = "DATE",
    TIME = "TIME",
    DATETIME = "DATETIME",
    WEEK = 'WEEK',
    MONTH = "MONTH",
    YEAR = "YEAR",
    REFERENCE = "REFERENCE"
}

export interface BiData {
    columns: Column[];
    list: any;
}

export interface Column {
    name: string;
}