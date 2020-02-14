export interface Bi {
    export: boolean
    dimensions: Dimension[];
    charts: Chart[];
}

export interface Chart {
    code: string;
    name: string;
    grid: number;
    linkage: boolean;
    loading: boolean;
    option: object;
    chartOption: any;
}

export interface Dimension {
    code: string;
    title: string;
    type: string;
    vague: boolean;
    notNull: boolean;
    dependDimension: string;
    $value: any;
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