export interface CubeMeta {
    code: string;
    title: string;
    description?: string;
    tags: string[];                     // 标签列表
    dimensions: CubeMetaDimension[];    // 维度列表
    measures: CubeMetaMeasure[];        // 指标列表
    parameters: CubeMetaParameter[];
}

/**
 * 维度元数据接口
 */
export interface CubeMetaDimension {
    code: string;        // 字段名
    title: string;       // 标题
    description?: string; // 描述
    hidden: boolean;     // 是否隐藏
    tags: string[];      // 标签列表
    type: FieldType;
}

/**
 * 指标元数据接口
 */
export interface CubeMetaMeasure {
    code: string;        // 字段名
    title: string;       // 标题
    description?: string; // 描述
    hidden: boolean;     // 是否隐藏
    tags: string[];      // 标签列表
    type: FieldType;
}

export interface CubeMetaParameter {
    code: string;        // 字段名
    title: string;       // 标题
    description?: string; // 描述
    type: FieldType;
}

export enum FieldType {
    NUMBER = "NUMBER",
    STRING = "STRING",
    DATE_TIME = "DATE_TIME"
}
