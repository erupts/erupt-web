import {GridsterItem} from "angular-gridster2";
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
    publishTime?: Date | string;  // 发布时间
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
 * 仪表板 DSL 定义
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
    autoRefreshInterval?: number; // 自动刷新间隔（秒），0 表示不自动刷新
    gap?: number;                 // 报表间距
}

export interface FilterDSL {
    title: string;
    field: string;
    hidden?: boolean;
    notNull?: boolean;  // 排除空值（下拉选项过滤）
    operator?: CubeOperator;
    defaultValue?: any;
    value?: any;
    linkage?: string[]; // 联动
}

export interface CompareConfig {
    enabled?: boolean;
    type?: 'YOY' | 'MOM';
    filterField?: string;
    currentLabel?: string;
    compareLabel?: string;
}

/**
 * 报表 DSL 定义
 */
export interface ReportDSL extends GridsterItem {
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
}
