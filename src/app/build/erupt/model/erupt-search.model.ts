export interface EruptSearchModel {
    field: string;
    operatorType: OperatorType;
    operator: OperatorDateType | OperatorNumberType | OperatorReferenceType | OperatorStringType;
    value: any;
}

export enum OperatorType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    BOOLEAN = 'BOOLEAN',
    CHOICE = 'CHOICE',
    REFERENCE = 'REFERENCE',
}

export enum OperatorStringType {
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
}

export enum OperatorNumberType {
    EQ = 'EQ',
    NEQ = 'NEQ',
    GT = 'GT',
    LT = 'LT',
    EGT = 'EGT',
    ELT = 'ELT',
    RANGE = 'RANGE',
    NULL = 'NULL',
    NOT_NULL = 'NOT_NULL',
}

export enum OperatorDateType {
    TODAY = 'TODAY',
    FEW_DAYS = 'FEW_DAYS',
    FUTURE_DAYS = 'FUTURE_DAYS',
    RANGE = 'RANGE',
    GT = 'GT',
    LT = 'LT',
    EGT = 'EGT',
    ELT = 'ELT',
    NULL = 'NULL',
    NOT_NULL = 'NOT_NULL',
}

export enum OperatorReferenceType {
    EQ = 'EQ',
    NEQ = 'NEQ',
    NULL = 'NULL',
    NOT_NULL = 'NOT_NULL',
}

