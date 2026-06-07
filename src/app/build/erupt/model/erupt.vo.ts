export class TableStyle {
    public static power = "__power__";
}

export enum QueryExpression {
    EQ = 'EQ',
    NEQ = 'NEQ',
    LIKE = 'LIKE',
    NOT_LIKE = 'NOT_LIKE',
    RANGE = 'RANGE',
    IN = 'IN',
    NULL = 'NULL',
    NOT_NULL = 'NOT_NULL',
    GT = 'GT',
    GTE = 'GTE',
    LT = 'LT',
    LTE = 'LTE',
}

export interface QueryCondition {
    key: string;
    value: any;
    expression?: QueryExpression;
}
