import {NodeRule} from "@flow/model/node.model";

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
    rule?: NodeRule[];
    permission?: string;
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

export interface FlowUpmsScope {
    scope: UpmsScope;
    scopeValue: number;
}

export enum UpmsScope {

    ORG = "ORG",
    USER = "USER",
    ROLE = "ROLE",
    POST = "POST"

}
