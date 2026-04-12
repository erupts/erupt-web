export interface CubeMeta {
    code: string;
    title: string;
    description?: string;
    tags: string[];                     // 标签列表
    dimensions: CubeMetaDimension[];    // 维度列表
    measures: CubeMetaMeasure[];        // 指标列表
    parameters: CubeMetaParameter[];
    fieldTitleMap?: Map<string, string>;
    fieldMap?: Map<string, BaseField>;
}

export interface BaseField {
    code: string;         // 字段名
    title: string;        // 标题
    description?: string; // 描述
    type: FieldType;
    hidden: boolean
}

/**
 * 维度元数据接口
 */
export interface CubeMetaDimension extends BaseField {
    tags: string[];
}

/**
 * 指标元数据接口
 */
export interface CubeMetaMeasure extends BaseField {
    tags: string[];
}

export interface CubeMetaParameter extends BaseField {
    tags: string[];
}

export enum FieldType {
    NUMBER = "NUMBER",
    STRING = "STRING",
    DATE = "DATE",
}
