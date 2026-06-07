export class TableStyle {
    public static power = "__power__";
}

export interface QueryCondition {
    key: string;
    value: any;
    operator?: string;
}

export enum Expression {
    EQ = "EQ",
    RANGE = "RANGE",
    IN = "IN"
}
