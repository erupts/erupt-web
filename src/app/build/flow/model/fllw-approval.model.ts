import {FormAccessEnum} from "@flow/model/flow.model";

export enum ReviewMode {
    /** 提交人本人 */
    SUBMITTER_HIMSELF = 'SUBMITTER_HIMSELF',

    /** 直属上级 */
    DIRECT_MANAGER = 'DIRECT_MANAGER',

    /** 部门负责人 */
    DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',

    /** 角色 */
    ROLE = 'ROLE',

    /** 部门内指定岗位 */
    POST = 'POST',

    /** 指定人员 */
    SPECIFIED_USER = 'SPECIFIED_USER',

    /** 多级上级 */
    MULTI_LEVEL_SUPERVISOR = 'MULTI_LEVEL_SUPERVISOR',

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
