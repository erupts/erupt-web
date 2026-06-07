import {GridsterItemConfig} from "angular-gridster2";
import {CubeOperator, FilterGroup, Sort} from "./cube-query.model";

export interface EruptUser {
    id: number;
    avatar: string;
    name: string;
}

export interface Dashboard {
    id?: number;
    createTime?: Date | string;
    updateTime?: Date | string;
    createUser?: EruptUser;
    updateUser?: EruptUser;
    code: string;
    name: string;
    description?: string;

    cuber: string;
    explore: string;

    draftDsl?: DashboardDSL;
    publishDsl?: DashboardDSL;
    publishTime?: Date | string;  // publish time
}

export interface DashboardPublishHistory {
    id: number;
    dashboardId: number;
    description?: string;
    dsl?: DashboardDSL;
    createTime?: Date | string;
    createUser?: EruptUser;
}

export enum DashboardTheme {
    LIGHT = 'light',
    DARK = 'dark',
}

/**
 * Dashboard DSL definition
 */
export interface DashboardDSL {
    filters?: FilterDSL[];
    reports?: ReportDSL[];
    settings?: DashboardSettings;
    subModels?: SubModelDSL[];
}

export interface SubModelDSL {
    id: string;
    alias: string;
    cube: string;
    explore: string;
    fieldMappings?: FieldMapping[];
}

export interface FieldMapping {
    dashboardField: string;
    subField: string;
}

export interface DashboardSettings {
    backgroundColor?: string;
    backgroundImage?: string;
    theme?: DashboardTheme;
    autoRefreshInterval?: number; // auto-refresh interval (seconds), 0 means no auto-refresh
    gap?: number;                 // report spacing
}

export interface FilterDSL {
    title: string;
    field: string;
    hidden?: boolean;
    notNull?: boolean;  // exclude null values (dropdown option filter)
    operator?: CubeOperator;
    // Absolute value, or relative-time string "PAST:<days>" / "FUTURE:<days>"
    defaultValue?: any;
    value?: any;
    linkage?: string[]; // linkage
}

/** Parse "PAST:7" / "FUTURE:14" from defaultValue. Returns null for absolute values. */
export function parseRelativeDefault(value: any): {type: 'PAST' | 'FUTURE'; days: number} | null {
    if (typeof value !== 'string') return null;
    const m = value.match(/^(PAST|FUTURE):(\d+)$/);
    return m ? {type: m[1] as 'PAST' | 'FUTURE', days: parseInt(m[2], 10)} : null;
}

export interface CompareConfig {
    enabled?: boolean;
    type?: 'YOY' | 'MOM';
    filterField?: string;
    currentLabel?: string;
    compareLabel?: string;
}

/**
 * Report DSL definition
 */
export interface ReportDSL extends GridsterItemConfig {
    type?: ReportType;
    title?: string;
    description?: string;
    subModel?: string;
    cube?: Partial<Record<CubeKey | string, string[] | string>>
    ui?: Record<string, any>;
    sorts?: Sort[];
    filterGroups?: FilterGroup[];
    compare?: CompareConfig;
}

export enum CubeKey {
    xField = 'xField',
    yField = 'yField',
    seriesField = 'seriesField',
    sizeField = "sizeField",
    colorField = 'colorField',

    sourceField = 'sourceField',
    targetField = 'targetField',
    weightField = 'weightField',

    rowsField = 'rowsField',
    columnsField = 'columnsField',
    valuesField = 'valuesField',
}

/**
 * Report type enum
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
    TREEMAP = 'TREEMAP',
    HEATMAP = 'HEATMAP',

    TINY_LINE = 'TINY_LINE',
    TINY_AREA = 'TINY_AREA',
    TINY_COLUMN = 'TINY_COLUMN',
    PROGRESS = 'PROGRESS',
    RING_PROGRESS = 'RING_PROGRESS',
    TABLE = 'TABLE',
    PIVOT_TABLE = 'PIVOT_TABLE',
    KPI = 'KPI',
    TEXT = 'TEXT',
}
