/**
 * Sort direction
 */
export enum Direction {
    ASC = "ASC",
    DESC = "DESC"
}

/**
 * Sort object
 */
export interface Sort {
    field?: string;
    direction?: Direction;
}

/**
 * Query operator
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

export enum CubeOperatorLogin {
    AND = "AND",
    OR = "OR",
}

export interface FilterGroup {
    logic: CubeOperatorLogin;
    conditions: CubeFilter[];
}

/**
 * Filter
 */
export interface CubeFilter {
    field?: string;
    operator?: CubeOperator;
    value?: any;
}

/**
 * Cube query object
 */
export interface CubeQuery {
    cube: string;
    explore: string;
    dimensions?: string[];
    measures?: string[];
    filters?: CubeFilter[];
    filterGroups?: FilterGroup[];
    dimensionFormat?: Record<string, DimensionFormat>;
    parameter?: Record<string, any>;
    sorts?: Sort[];
    groupBy?: boolean; // default value is true
    limit?: number;
    offset?: number;
}

export enum DimensionFormat {
    DAY = "DAY",
    MONTH = "MONTH",
    YEAR = "YEAR",
    // QUARTER = "QUARTER",
    // WEEK = "WEEK",
    // HOUR = "HOUR",
    // MINUTE = "MINUTE",
    // SECOND = "SECOND",
}
