/**
 * 排序方向
 */
export enum Direction {
    ASC = "ASC",
    DESC = "DESC"
}

/**
 * 排序对象
 */
export interface Sort {
    field?: string;
    direction?: Direction;
}

/**
 * 查询操作符
 */
export enum CubeOperator {
    EQ = "EQ",
    NEQ = "NEQ",
    LIKE = "LIKE",
    NOT_LIKE = "NOT_LIKE",
    START_WITH = "START_WITH",
    END_WITH = "END_WITH",
    IN = "IN",
    NOT_IN = "NOT_IN",
    NULL = "NULL",
    NOT_NULL = "NOT_NULL",

    GT = "GT",
    LT = "LT",
    EGT = "EGT",
    ELT = "ELT",

    BETWEEN = "BETWEEN",
    FEW_DAYS = "FEW_DAYS",
    FUTURE_DAYS = "FUTURE_DAYS",
}

/**
 * 过滤器
 */
export interface CubeFilter {
    field?: string;
    operator?: CubeOperator;
    value?: any;
}

/**
 * 立方体查询对象
 */
export interface CubeQuery {
    cube: string;
    explore: string;
    dimensions?: string[];
    measures?: string[];
    filters?: CubeFilter[];
    parameters?: Record<string, any>;
    sorts?: Sort[];
    groupBy?: boolean; // 默认值为 true
    limit?: number;
    offset?: number;
}

export interface CubeQueryResponse {
    data: any[];
    total: number;
}
