export interface FlowGroup {
    id: number;
    name: string;
    sort: number;
}

export interface FlowConfig {
    id?: number;
    name?: string;
    remark?: string;
    erupt?: string;
    icon?: string;
    color?: string;
    flowGroup?: FlowGroup;
    enable?: boolean;
    rule?: any;
    setting?: Record<string, any>;
}

export interface FlowRule {
    ruleNodes: FlowRuleNode[];
}

export interface FlowRuleNode {
    code: string;
    name: string;
    type: string;
    branches: FlowRuleNode[]
}
