import {NodeRule} from "@flow/model/node.model";
import {PrintPageConfig} from "@shared/model/erupt-print";

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
    code: string;
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
    printSetting: PrintSetting = PrintSetting.DEFAULT;
    printTemplate: string = null;
    printPageConfig: PrintPageConfig = null;
}


export enum PrintSetting {
    CLOSE = 'CLOSE',
    DEFAULT = 'DEFAULT',
    CUSTOM = 'CUSTOM'
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
    READONLY = "READONLY",      // Read-only
    READ_WRITE = "READ_WRITE",  // Read-write
    NOT_NULL = "NOT_NULL",      // Required
    HIDE = "HIDE"               // Hidden

}
