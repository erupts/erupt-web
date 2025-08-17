import {FlowConfig} from "@flow/model/flow.model";

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
    status: string;
    initiatorUser: User;
    finishTime: string;
    createTime: string;
}

export interface FlowInstanceComment {
    createUser: User;
    createTime: string;
    comment: string;

}

export interface FlowInstanceTask {
    assigneeUser: User;
    createTime: string;

    taskType: string;
    taskStatus: string;
    comment: string;
}

export interface User {
    id: number;
    name: string;
}
