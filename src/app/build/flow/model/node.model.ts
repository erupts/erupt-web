export interface NodeRule {
    id: string;
    name: string;
    type: NodeType;
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
    IF = 'IF',
    ELSE = 'ELSE',

    FlEX = 'FLEX',
}
