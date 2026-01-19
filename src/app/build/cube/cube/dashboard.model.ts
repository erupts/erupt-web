import {GridsterItem} from "angular-gridster2";

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
    filters?: CubeFilter[];
    reports?: ReportDSL[];
}

/**
 * 报表 DSL 定义
 */
export interface ReportDSL extends GridsterItem {
    type?: ReportType;
    title?: string;
    description?: string;
    cubeQuery?: CubeQuery;
    cube?: Partial<Record<CubeKey | string, string[] | string>>
    ui?: Record<string, any>;
    xField?: string;
    yField?: string;
}

export enum CubeKey {
    xField = 'xField',
    yField = 'yField',
    seriesField = 'seriesField',
    COLOR = 'COLOR',
    SIZE = 'SIZE',
    sourceField = 'sourceField',
    targetField = 'targetField',
    weightField = 'weightField',
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
    TABLE = 'TABLE'
}

/**
 * Cube 查询定义
 */
export interface CubeQuery {
    cube?: string;
    explore?: string;
    dimensions?: string[];
    measures?: string[];
    filters?: CubeFilter[];
    parameters?: Record<string, any>;
    sorts?: Sort[];
    groupBy?: boolean; // 默认为 true
    dryRun?: boolean;  // 默认为 false
    limit?: number;
    offset?: number;
}

/**
 * Cube 过滤器定义
 */
export interface CubeFilter {
    field?: string;
    operator?: CubeOperator;
    value?: any;
}

/**
 * 排序定义
 */
export interface Sort {
    field?: string;
    direction?: Direction;
}

/**
 * 排序方向
 */
export enum Direction {
    ASC = 'ASC',
    DESC = 'DESC'
}

/**
 * Cube 操作符枚举
 */
export enum CubeOperator {
    EQ = 'EQ',
    NEQ = 'NEQ',
    LIKE = 'LIKE',
    NOT_LIKE = 'NOT_LIKE',
    START_WITH = 'START_WITH',
    END_WITH = 'END_WITH',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
    NULL = 'NULL',
    NOT_NULL = 'NOT_NULL',
    GT = 'GT',
    LT = 'LT',
    EGT = 'EGT',
    ELT = 'ELT',
    RANGE = 'RANGE'
}
