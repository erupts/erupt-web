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

export class FlowConfig {
    id: number;
    name: string;
    remark: string;
    erupt: string;
    channels: string[] = [];
    icon: string = 'fa fa-user';
    color: string = '#1890ff';
    flowGroup: FlowGroup;
    enable: boolean;
    rule: NodeRule[];
    permission: FlowPermission = FlowPermission.ALL;
    permissionScope: FlowUpmsScope[]
    setting: FlowConfigSetting = new FlowConfigSetting();
}

export class FlowConfigSetting {
    subTitleFields: string[] = [];
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
    DEFAULT = "DEFAULT",
    READONLY = "READONLY",      // 只读
    READ_WRITE = "READ_WRITE",  // 读写
    NOT_NULL = "NOT_NULL",      // 必填
    HIDE = "HIDE"               // 隐藏

}
