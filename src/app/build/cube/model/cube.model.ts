export interface CubeMeta {
    code: string;
    title: string;
    description?: string;
    tags: string[];                     // tag list
    dimensions: CubeMetaDimension[];    // dimension list
    measures: CubeMetaMeasure[];        // measure list
    parameters: CubeMetaParameter[];
    fieldTitleMap?: Map<string, string>;
    fieldMap?: Map<string, BaseField>;
}

export interface BaseField {
    code: string;         // field name
    title: string;        // title
    description?: string; // description
    type: FieldType;
    hidden: boolean
}

/**
 * Dimension metadata interface
 */
export interface CubeMetaDimension extends BaseField {
    tags: string[];
}

/**
 * Measure metadata interface
 */
export interface CubeMetaMeasure extends BaseField {
    tags: string[];
    drillFields?: string[];  // if specified, only these dimension codes are used for drill-down
}

export interface CubeMetaParameter extends BaseField {
    tags: string[];
}

export enum FieldType {
    NUMBER = "NUMBER",
    STRING = "STRING",
    DATE = "DATE",
}
