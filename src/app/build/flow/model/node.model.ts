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

    PARALLEL = "PARALLEL",
    BRANCH = "BRANCH",

    EXCLUSION = 'EXCLUSION',

    FlEX = 'FLEX',
}


export enum BranchType {
    CONDITION = "CONDITION", //条件分支
    ELSE = "ELSE"    //兜底分支
}
