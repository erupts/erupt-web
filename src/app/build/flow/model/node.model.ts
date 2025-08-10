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
    IF = 'IF',
    ELSE = 'ELSE',

    FlEX = 'FLEX',
}
