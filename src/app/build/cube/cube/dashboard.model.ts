export interface Dashboard {
    id?: number | string;
    createTime?: Date | string;
    updateTime?: Date | string;
    createUser?: string;
    updateUser?: string;
    code: string;                // 编码
    name: string;                 // 名称 (notNull = true)
    description?: string;         // 描述

    cube: string;                 // Cube (notNull = true)
    explore: string;              // Explore (notNull = true)

    draftDsl?: DashboardDSL;
    publishDsl?: DashboardDSL;
    publishTime?: Date | string;  // 发布时间
}

/**
 * 仪表板 DSL 定义
 */
export interface DashboardDSL {
    filters?: string[];
    reports?: ReportDSL[];
}

/**
 * 报表 DSL 定义
 */
export interface ReportDSL {
    cols?: number; // 最大网格 24
    rows?: number;
    x?: number;    // 最大网格 24
    y?: number;    // 最大网格 24
    type?: ReportType;
    cubeQuery?: CubeQuery;
    config?: any;
}

/**
 * 报表类型枚举
 */
export enum ReportType {
    LINE = 'LINE',
    BAR = 'BAR',
    PIE = 'PIE',
    RADAR = 'RADAR',
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
