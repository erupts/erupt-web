import {GridsterItem} from "angular-gridster2";
import {CubeOperator} from "./cube-query.model";

export interface Dashboard {
    id?: number;
    createTime?: Date | string;
    updateTime?: Date | string;
    createUser?: string;
    updateUser?: string;
    code: string;
    name: string;
    description?: string;

    cuber: string;
    explore: string;

    draftDsl?: DashboardDSL;
    publishDsl?: DashboardDSL;
    publishTime?: Date | string;  // 发布时间
}

/**
 * 仪表板 DSL 定义
 */
export interface DashboardDSL {
    filters?: FilterDSL[];
    reports?: ReportDSL[];
}

export interface FilterDSL {
    field: string;
    operator?: CubeOperator;
    control?: FilterControl
    defaultValues?: any;
    value?: any;
}


export enum FilterControl {
    MULTI_SELECT = "MULTI_SELECT",
    CHECKBOX = "CHECKBOX",
    SINGLE_SELECT = "SINGLE_SELECT",
    RADIO = "RADIO",
}

/**
 * 报表 DSL 定义
 */
export interface ReportDSL extends GridsterItem {
    type?: ReportType;
    title?: string;
    description?: string;
    cube?: Partial<Record<CubeKey | string, string[] | string>>
    ui?: Record<string, any>;
}

export enum CubeKey {
    xField = 'xField',
    yField = 'yField',
    seriesField = 'seriesField',
    sizeField = "sizeField",

    sourceField = 'sourceField',
    targetField = 'targetField',
    weightField = 'weightField',

    rowsField = 'rowsField',
    columnsField = 'columnsField',
    valuesField = 'valuesField',

    sortField = 'sortField',
    sortDirection = 'sortDirection',
}

/**
 * 报表类型枚举
 */
export enum ReportType {
    LINE = 'LINE',
    AREA = 'AREA',
    BAR = 'BAR',
    COLUMN = 'COLUMN',
    PIE = 'PIE',
    SCATTER = 'SCATTER',
    RADAR = 'RADAR',
    FUNNEL = 'FUNNEL',
    DUAL_AXES = 'DUAL_AXES',
    GAUGE = 'GAUGE',
    WATERFALL = 'WATERFALL',
    WORD_CLOUD = 'WORD_CLOUD',
    ROSE = 'ROSE',
    RADIAL_BAR = 'RADIAL_BAR',

    SANKEY = 'SANKEY',
    CHORD = 'CHORD',
    BUBBLE = 'BUBBLE',

    TINY_LINE = 'TINY_LINE',
    TINY_AREA = 'TINY_AREA',
    TINY_COLUMN = 'TINY_COLUMN',
    PROGRESS = 'PROGRESS',
    RING_PROGRESS = 'RING_PROGRESS',
    TABLE = 'TABLE',
    PIVOT_TABLE = 'PIVOT_TABLE',
    KPI = 'KPI',
}
