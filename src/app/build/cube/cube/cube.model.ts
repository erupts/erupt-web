export interface CubeMeta {
    code: string;                       // Cube 编码
    title: string;                      // Cube 名称
    description?: string;               // Cube 描述
    tags: string[];                     // 标签列表
    dimensions: CubeMetaDimension[];    // 维度列表
    measures: CubeMetaMeasure[];        // 指标列表
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
}

