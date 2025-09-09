import {NodeRule} from "@flow/model/node.model";

export interface FlowGroup {
    id: number;
    name: string;
    sort: number;
}

export enum FlowPermission {
    ALL = 'ALL',
    MANAGER = 'MANAGER',
    SPECIFIC = 'SPECIFIC',
    NO = 'NO'
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
    permission?: FlowPermission;
    permissionScope?: FlowUpmsScope[]
    setting?: Record<string, any>;
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

export enum FormAccessEnum {
    READONLY = "READONLY", // 只读
    READ_WRITE = "READ_WRITE", // 读写
    HIDE = "HIDE" // 隐藏

}
