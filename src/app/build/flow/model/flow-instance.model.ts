import {FlowConfig} from "@flow/model/flow.model";
import {NodeRule} from "@flow/model/node.model";

export enum ApprovalView {
    TODO = 'TODO',
    DONE = 'DONE',
    CC = 'CC',
    CREATED = 'CREATED',
    ADMIN = 'ADMIN'
}

export enum FlowTurn {
    NEXT = "NEXT",
    WAIT = "WAIT",
    WAIT_API_TRIGGER = "WAIT_API_TRIGGER",
    ERROR = "ERROR",
    REENTRY = "REENTRY",
    END = "END"
}

export interface FlowInstance {
    id: number;
    no: string;
    data: any;
    eruptFlowConfig: FlowConfig;
    erupt: string;
    eruptModelId: string;
    status: InstanceStatus;
    rule: NodeRule[];
    initiatorUser: User;
    finishTime: string;
    createTime: string;
    parent: FlowInstance;
    // only /flow/instance/list
    taskId?: number
    taskNodeInfo?: NodeRule
    taskType?: TaskType
    source?: InstanceSource
}

export enum InstanceSource {
    MANUAL = "MANUAL",
    SUB_NODE = "SUB_NODE",
    API = "API"
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
    nodeRowspan?: number;
    id: number;
    nodeId: string;
    nodeName: string;
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

export enum TaskType {
    /** Start */
    START = 'START',

    /** CC (carbon copy) */
    CC = 'CC',

    /** Assignee handling */
    ASSIGNEE = 'ASSIGNEE',

    /** Or-sign approval */
    USER_APPROVAL = 'USER_APPROVAL',

    /** Joint approval (parallel) */
    USER_APPROVAL_PARALLEL = 'USER_APPROVAL_PARALLEL',

    /** Transfer */
    TRANSFER = 'TRANSFER',

    /** Withdraw */
    WITHDRAWN = 'WITHDRAWN',

    /** Add-sign: pre-sign */
    PRE_SIGN = 'PRE_SIGN',

    /** Add-sign: post-sign */
    POST_SIGN = 'POST_SIGN',

    /** Rollback */
    ROLLBACK = 'ROLLBACK',

    /** Timeout auto-pass */
    TIMEOUT_AUTO_PASS = 'TIMEOUT_AUTO_PASS',

    /** Timeout auto-reject */
    TIMEOUT_AUTO_REJECT = 'TIMEOUT_AUTO_REJECT',
}

export interface User {
    id: number;
    avatar: string;
    name: string;
}


