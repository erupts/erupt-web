export interface NodeRule {
    id: string;
    name: string;
    type: NodeType;
    flex?: string;
    prop?: any;
    error?: string;
    branches?: NodeRule[];
}

export enum NodeType {
    START = 'START',
    END = 'END',

    SUB = 'SUB',
    CC = 'CC',
    APPROVAL = 'APPROVAL',
    FlEX = 'FLEX',

    GATEWAY_PARALLEL = "GATEWAY_PARALLEL",
    GATEWAY_INCLUSIVE = "GATEWAY_INCLUSIVE",
    GATEWAY_EXCLUSION = 'GATEWAY_EXCLUSION',
    GATEWAY_BRANCH = "GATEWAY_BRANCH",
    GATEWAY_JOIN = "GATEWAY_JOIN",
}


export enum BranchType {
    PARALLEL_CONDITION = "PARALLEL_CONDITION",
    CONDITION = "CONDITION", //条件分支
    ELSE = "ELSE"    //兜底分支
}
