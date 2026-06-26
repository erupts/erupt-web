import {FormAccessEnum} from "@flow/model/flow.model";
import {ApprovalView} from "@flow/model/flow-instance.model";

export class ApprovalQuery {
    approvalView: ApprovalView;
    flowId?: number;
    flowInstanceNo?: string;
    page: number = 0;
    size: number = 15;
}

export enum AddSignType {
    PRE_SIGN = "PRE_SIGN",
    POST_SIGN = "POST_SIGN"
}

export enum ReviewMode {
    /** Submitter themselves */
    SUBMITTER_HIMSELF = 'SUBMITTER_HIMSELF',

    /** Role */
    ROLE = 'ROLE',

    /** Specified position */
    POST = 'POST',

    /** Specified user */
    SPECIFIED_USER = 'SPECIFIED_USER',

    /** Organization head */
    ORG_HEAD = 'ORG_HEAD',

    /** Division leader */
    DIVISION_LEADER = 'DIVISION_LEADER',

    SELF_SELECT = 'SELF_SELECT',

    NODE_ASSIGNED = 'NODE_ASSIGNED'

}

export interface ReviewModeValue {
    mode: ReviewMode;
    modeValue: any;
}

export enum ApprovalStrategy {
    /** Joint approval: all approvers must agree */
    ALL_APPROVE = 'ALL_APPROVE',

    /** Or-approval: any single approver's agreement is sufficient */
    ANY_APPROVE = 'ANY_APPROVE',
}

export enum NobodyStrategy {
    /** When there is no approver, transfer to the administrator */
    REDIRECT_TO_ADMIN = 'REDIRECT_TO_ADMIN',

    /** When there is no approver, redirect to a specified approver */
    REDIRECT_TO_SPECIFIED_USER = 'REDIRECT_TO_SPECIFIED_USER',
}

export enum SamePersonApprovalStrategy {
    SELF_APPROVAL = "SELF_APPROVAL",
    SKIPPED_APPROVAL = "SKIPPED_APPROVAL"
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

    nobodyStrategy: NobodyStrategy = NobodyStrategy.REDIRECT_TO_ADMIN;

    samePersonApprovalStrategy: SamePersonApprovalStrategy = SamePersonApprovalStrategy.SELF_APPROVAL;

    nobodyRedirectToUser: number;

    /** Allow transfer */
    allowTransfer: boolean = true;

    /** Allow add-sign */
    allowAddSign: boolean = true;

    /** Allow CC */
    allowCc: boolean = true;

    /** Allow return */
    allowReturn: boolean = true;

    /** Approval submission requires an approval comment */
    requireApprovalNote: boolean = false;

    /** Handwritten signature required when approving */
    requireSignature: boolean = false;

    approvalTimeoutEnabled: boolean = false;

    approvalTimeoutHours: number;

    approvalTimeoutAction: ApprovalTimeoutAction;
}

export enum ApprovalTimeoutAction {

    AUTO_PASS = 'AUTO_PASS',
    AUTO_REJECT = 'AUTO_REJECT',

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

export class AssigneeNode {

    formAccesses: Record<string, FormAccessEnum> = {};

    reviewUserModes: ReviewModeValue[] = [
        {
            mode: ReviewMode.SUBMITTER_HIMSELF,
            modeValue: null
        },
    ];

}

export class StartNode {

    formAccesses: Record<string, FormAccessEnum> = {};

}

export interface Mapping {
    source: string
    target: string
}

export class SubNode {

    subFlowId: number;

    turnRule: string = SubTurnRule.WAIT_COMPLETE;

    mappings: Mapping[] = [];

    lunchMode: ReviewModeValue = {
        mode: ReviewMode.SUBMITTER_HIMSELF,
        modeValue: null
    };

    mappingsReverse: Mapping[] = [];

}

export enum SubTurnRule {

    // Proceed to the next node after the sub-flow completes
    WAIT_COMPLETE = "WAIT_COMPLETE",

    // Proceed to the next node after the sub-flow is initiated
    FIRE_AND_FORGET = "FIRE_AND_FORGET"

}
