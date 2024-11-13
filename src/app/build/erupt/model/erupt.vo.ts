export class TableStyle {
    public static power = "__power__";
}

export interface QueryCondition {
    key: string;
    value: any;
}

export enum Expression {
    EQ = "EQ",
    RANGE = "RANGE",
    IN = "IN"
}
