import {FormAccessEnum} from "@flow/model/flow.model";
import {ApprovalView} from "@flow/model/flow-instance.model";

export class ApprovalQuery {
    approvalView: ApprovalView;
    flowId?: number;
}

export enum AddSignType {
    PRE_SIGN = "PRE_SIGN",
    POST_SIGN = "POST_SIGN"
}

export enum ReviewMode {
    /** 提交人本人 */
    SUBMITTER_HIMSELF = 'SUBMITTER_HIMSELF',

    /** 角色 */
    ROLE = 'ROLE',

    /** 指定岗位 */
    POST = 'POST',

    /** 指定人员 */
    SPECIFIED_USER = 'SPECIFIED_USER',

    /** 组织负责人 */
    ORG_HEAD = 'ORG_HEAD',

}

export interface ReviewModeValue {
    mode: ReviewMode;
    modeValue: any;
}

export enum ApprovalStrategy {
    /** 会签：需所有审批人同意 */
    ALL_APPROVE = 'ALL_APPROVE',

    /** 或签：一名审批人同意即可 */
    ANY_APPROVE = 'ANY_APPROVE',
}

export class ApproveNode {

    reviewUserModes: ReviewModeValue[] = [
        {
            mode: ReviewMode.SUBMITTER_HIMSELF,
            modeValue: null
        },
    ];

    formAccesses: Record<string, FormAccessEnum> = {};

    approvalStrategy: ApprovalStrategy = ApprovalStrategy.ANY_APPROVE;

    /** 允许转交 */
    allowTransfer: boolean = true;

    /** 允许加签 */
    allowAddSign: boolean = true;

    /** 允许抄送 */
    allowCc: boolean = true;

    /** 允许退回 */
    allowReturn: boolean = false;

    /** 提交审批需填写审批意见 */
    requireApprovalNote: boolean = false;

    /** 审批同意时需手写签名 */
    requireSignature: boolean = false;
}

export class CcNode {

    reviewUserModes: ReviewModeValue[] = [
        {
            mode: ReviewMode.SUBMITTER_HIMSELF,
            modeValue: null
        },
    ];

    formAccesses: Record<string, FormAccessEnum> = {};

}

export class StartNode {

    formAccesses: Record<string, FormAccessEnum> = {};

}

export class SubNode {

    subFlowId: number;

    mappings: {
        source: string
        target: string
    }[] = [];

}
