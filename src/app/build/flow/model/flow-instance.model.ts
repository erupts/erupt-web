import {FlowConfig} from "@flow/model/flow.model";
import {NodeRule} from "@flow/model/node.model";

export enum ApprovalView {
    TODO = 'TODO',
    DONE = 'DONE',
    CC = 'CC',
    CREATED = 'CREATED'
}

export interface FlowInstance {
    id: number;
    no: string;
    eruptFlowConfig: FlowConfig;
    erupt: string;
    eruptModelId: string;
    status: InstanceStatus;
    rule: NodeRule[];
    initiatorUser: User;
    finishTime: string;
    createTime: string;
}

export enum InstanceStatus {
    PENDING = "PENDING",
    FINISH = "FINISH",
    REJECTED = "REJECTED",
    WITHDRAWN = "WITHDRAWN",
    DELETED = "DELETED",
    TERMINATED = "TERMINATED"
}

export interface FlowInstanceComment {
    createUser: User;
    createTime: string;
    comment: string;
}

export interface FlowInstanceDataHistory {
    id: number;
    createUser: User;
    createTime: string;
    beforeData: string;
    afterData: string;
}

export interface FlowInstanceTask {
    id: number;
    nodeId: number;
    assigneeUser: User;
    createTime: string;
    completedAt: string;
    taskType: string;
    taskStatus: string;
    comment: string;
    flowInstance: FlowInstance;
    signature: string;
    parentTask: FlowInstanceTask
}

export interface User {
    id: number;
    avatar: string;
    name: string;
}


