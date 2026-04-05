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
    /** 开始 */
    START = 'START',

    /** 抄送 */
    CC = 'CC',

    /** 办理 */
    ASSIGNEE = 'ASSIGNEE',

    /** 或签 */
    USER_APPROVAL = 'USER_APPROVAL',

    /** 会签 */
    USER_APPROVAL_PARALLEL = 'USER_APPROVAL_PARALLEL',

    /** 转办 */
    TRANSFER = 'TRANSFER',

    /** 撤回 */
    WITHDRAWN = 'WITHDRAWN',

    /** 加签：前加签 */
    PRE_SIGN = 'PRE_SIGN',

    /** 加签：后加签 */
    POST_SIGN = 'POST_SIGN',

    /** 回退 */
    ROLLBACK = 'ROLLBACK',

    /** 超时自动通过 */
    TIMEOUT_AUTO_PASS = 'TIMEOUT_AUTO_PASS',

    /** 超时自动拒绝 */
    TIMEOUT_AUTO_REJECT = 'TIMEOUT_AUTO_REJECT',
}

export interface User {
    id: number;
    avatar: string;
    name: string;
}


