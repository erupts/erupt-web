export interface NodeRule {
    id: string;
    name: string;
    type: NodeType;
    flex?: string;
    prop?: any;
    branches?: NodeRule[];
}

export enum NodeType {
    START = 'START',
    END = 'END',
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
    CONDITION = "CONDITION", //条件分支
    ELSE = "ELSE"    //兜底分支
}
