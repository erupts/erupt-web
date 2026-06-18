import {ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {
    ApprovalView,
    FlowInstance,
    FlowInstanceComment,
    FlowInstanceDataHistory,
    FlowInstanceTask,
    InstanceStatus,
    TaskType
} from "@flow/model/flow-instance.model";
import {SignaturePadComponent} from "../../../erupt/components/signature-pad/signature-pad.component";
import {EruptFlowComponent} from "@flow/components/erupt-flow/erupt-flow.component";
import {NzCodeEditorComponent} from "ng-zorro-antd/code-editor";
import {NzModalService} from "ng-zorro-antd/modal";
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";
import {FlowApiService} from "@flow/service/flow-api.service";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {AddSignType, ReviewMode, SubNode} from "@flow/model/flow-approval.model";
import {KV} from "../../../erupt/model/util.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {EruptUser} from "../../../cube/model/dashboard.model";
import {forkJoin} from "rxjs";
import {getAvatarColor} from "@flow/util/flow.util";
import {ActivatedRoute} from "@angular/router";
import {FormAccessEnum, PrintSetting} from "@flow/model/flow.model";
import {FlowPrintPreviewComponent} from "./print-preview/print-preview.component";
import {I18NService} from "@core";
import {UpmsDataService} from "@flow/service/upms-data.service";

@Component({
    standalone: false,
    selector: 'flow-approval-detail',
    templateUrl: './flow-approval-detail.component.html',
    styleUrls: ['./flow-approval-detail.component.less']
})
export class FlowApprovalDetailComponent implements OnInit {

    activeTabIndex: number = 0;

    dataHistories: FlowInstanceDataHistory[] = [];

    // Newly added property to store data returned from the API
    instanceDetail: FlowInstance = null;

    instanceTasks: FlowInstanceTask[] = [];

    nodeInfo: NodeRule | null = null;

    comments: FlowInstanceComment[] = [];

    // Comment-related
    newComment: string = '';
    isSubmittingComment: boolean = false;

    eruptBuild: EruptBuildModel


    // Modal-related properties
    approveModalVisible: boolean = false;
    rejectModalVisible: boolean = false;
    ccModalVisible: boolean = false;
    transferModalVisible: boolean = false;
    addSignModalVisible: boolean = false;
    returnModalVisible: boolean = false;
    resubmitModalVisible: boolean = false;
    handleModalVisible: boolean = false;

    reason: string;
    approveSignature: string = null;
    ccUsers: number[] = [];
    transferUser: number | null = null;
    addSignUsers: number[] = [];
    addSignType: AddSignType = AddSignType.PRE_SIGN;
    returnNode: string;

    availableUsers: KV<number, string>[] = [];
    availableReturnNodes: KV<string, string>[] = [];

    assignedNodes: { id: string, name: string, userIds: number[] }[] = [];

    selfSelectNodes: KV<string, string>[] = [];
    nodeUsersOptions: { [key: string]: EruptUser[] } = {};
    selectedNodeUserIds: { [key: string]: number[] } = {};
    loadingSelfSelectNodes: boolean = false;

    dataDeleted: boolean = false;

    loadingEruptData: boolean = false;

    @Input() selectedInstance: FlowInstance;

    @Input() approvalView: ApprovalView = ApprovalView.TODO;

    @Output() reloadFlows = new EventEmitter<void>();

    constructor(private modal: NzModalService,
                private message: NzMessageService,
                private upmsApiService: FlowUpmsApiService,
                private flowApiService: FlowApiService,
                public i18n: I18NService,
                private cdr: ChangeDetectorRef,
                private dataHandlerService: DataHandlerService,
                private flowInstanceApiService: FlowInstanceApiService,
                public upmsDataService: UpmsDataService,
                @Inject(NzDrawerService) private drawerService: NzDrawerService,
                private route: ActivatedRoute) {
        const no = this.route.snapshot.paramMap.get('no');
        if (no) {
            flowInstanceApiService.detail(no).subscribe({
                next: (res) => {
                    this.onSelectFlow(ApprovalView.TODO, res.data);
                    flowInstanceApiService.list({
                        flowInstanceNo: no,
                        approvalView: ApprovalView.TODO,
                        page: 0,
                        size: 1
                    }).subscribe(res => {
                        if (res.data.list.length === 0) return;
                        this.instanceDetail.taskId = res.data.list[0].taskId;
                        this.instanceDetail.taskType = res.data.list[0].taskType;
                        this.nodeInfo = res.data.list[0].taskNodeInfo;
                    })
                }
            })
        }
    }

    ngOnInit(): void {
    }

    onSelectFlow(selectedView: ApprovalView, selectedInstance: FlowInstance) {
        this.approvalView = selectedView;
        this.selectedInstance = selectedInstance;
        if (this.selectedInstance) {
            this.loadInstanceDetail(selectedInstance);
        }
    }

    onReloadFlows() {
        this.selectedInstance = null;
        this.reloadFlows.emit()
    }

    // Load instance detail
    loadInstanceDetail(flow: FlowInstance) {
        // Load instance detail
        this.flowInstanceApiService.detail(flow.no).subscribe({
            next: (data) => {
                this.instanceDetail = data.data;
                this.instanceDetail.taskId = this.selectedInstance.taskId;
                this.instanceDetail.taskType = this.selectedInstance.taskType;
                this.instanceDetail.taskNodeInfo = this.selectedInstance.taskNodeInfo;
                this.nodeInfo = this.selectedInstance.taskNodeInfo;
                this.onTabChange(this.activeTabIndex)
                this.findAssignedNodes(this.instanceDetail.rule, this.nodeInfo.id);
            }
        });
    }

    // Approve
    approve() {
        this.reason = null;
        this.approveModalVisible = true;
    }

    // Handle task
    handle() {
        this.reason = null;
        this.handleModalVisible = true;
    }

    // Submit task handling
    submitHandle() {
        let data;
        if (Object.keys(this.nodeInfo?.prop?.formAccesses || {}).length) {
            data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        }

        for (let node of this.assignedNodes) {
            if (!node.userIds || node.userIds.length === 0) {
                this.message.warning(this.i18n.fanyi('flow.warning.select_approver_prefix') + node.name + this.i18n.fanyi('flow.warning.select_approver_suffix2'));
                return;
            }
        }
        const nodeAssignments: Record<string, number[]> = {};
        this.assignedNodes.forEach(node => {
            nodeAssignments[node.id] = node.userIds;
        });

        this.flowInstanceApiService.assignee(this.instanceDetail.taskId, this.reason, data, nodeAssignments).subscribe(res => {
            this.handleModalVisible = false;
            this.reason = null;
            this.message.success(this.i18n.fanyi('flow.success.handle'));
            this.onReloadFlows();
        })
    }

    private findAssignedNodes(rules: NodeRule[], currentNodeId: string) {
        if (!rules) return;
        this.assignedNodes = [];
        for (let rule of rules) {
            if ([NodeType.APPROVAL, NodeType.ASSIGNEE, NodeType.CC].includes(rule.type) && rule.prop?.reviewUserModes) {
                for (let mode of rule.prop.reviewUserModes) {
                    if (mode.mode === ReviewMode.NODE_ASSIGNED && mode.modeValue === currentNodeId) {
                        this.assignedNodes.push({
                            id: rule.id,
                            name: rule.name,
                            userIds: []
                        });
                        break;
                    }
                }
            }
            if (rule.type == NodeType.SUB) {
                let prop = <SubNode>rule.prop
                if (prop.lunchMode?.mode === ReviewMode.NODE_ASSIGNED && prop.lunchMode?.modeValue === currentNodeId) {
                    this.assignedNodes.push({
                        id: rule.id,
                        name: rule.name,
                        userIds: []
                    });
                }
            }
            if (rule.branches) {
                this.findAssignedNodes(rule.branches, currentNodeId);
            }
        }
    }

    // Reject approval
    reject() {
        this.reason = null;
        this.rejectModalVisible = true;
    }

    // CC approval
    cc() {
        this.reason = null;
        this.ccUsers = [];
        this.loadAvailableUsers();
        this.ccModalVisible = true;
    }

    // Submit approval
    submitApprove() {
        if (this.nodeInfo?.prop?.requireApprovalNote && !this.reason?.trim()) {
            this.message.warning(this.i18n.fanyi('flow.warning.fill_approve_opinion'));
            return;
        }
        for (let node of this.assignedNodes) {
            if (!node.userIds || node.userIds.length === 0) {
                this.message.warning(this.i18n.fanyi('flow.warning.select_approver_prefix') + node.name + this.i18n.fanyi('flow.warning.select_approver_suffix2'));
                return;
            }
        }
        this.approveModalVisible = true;
        let data;
        if (Object.keys(this.nodeInfo?.prop?.formAccesses || {}).length) {
            data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        }

        const nodeAssignments: Record<string, number[]> = {};
        this.assignedNodes.forEach(node => {
            nodeAssignments[node.id] = node.userIds;
        });

        this.flowInstanceApiService.agree(this.instanceDetail.taskId, this.reason, this.approveSignature, data, nodeAssignments).subscribe(res => {
            this.approveModalVisible = false;
            this.reason = null;
            this.message.success(this.i18n.fanyi('flow.success.approve'));
            this.onReloadFlows();
        })

    }

    // Submit rejection
    submitReject() {
        if (!this.reason?.trim()) {
            this.message.warning(this.i18n.fanyi('flow.warning.fill_reject_reason'));
            return;
        }
        this.flowInstanceApiService.refuse(this.instanceDetail.taskId, this.reason).subscribe(res => {
            this.rejectModalVisible = false;
            this.reason = null;
            this.message.success(this.i18n.fanyi('flow.success.reject'));
            this.onReloadFlows();
        })
    }

    // Submit CC
    submitCc() {
        if (this.ccUsers.length === 0) {
            this.message.warning(this.i18n.fanyi('flow.warning.select_cc_user'));
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning(this.i18n.fanyi('flow.warning.fill_cc_reason'));
            return;
        }

        this.flowInstanceApiService.cc(this.instanceDetail.taskId, this.ccUsers, this.reason).subscribe(res => {
            this.reason = null;
            this.ccUsers = [];
            this.ccModalVisible = false;
            this.message.success(this.i18n.fanyi('flow.success.cc'));
            // Refresh data
            if (this.selectedInstance?.id) {
                this.onReloadFlows();
            }
        })
    }


    // Submit transfer
    submitTransfer() {
        if (!this.transferUser) {
            this.message.warning(this.i18n.fanyi('flow.warning.select_transfer_user'));
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning(this.i18n.fanyi('flow.warning.fill_transfer_reason'));
            return;
        }

        this.flowInstanceApiService.transfer(this.instanceDetail.taskId, this.transferUser, this.reason).subscribe(res => {
            this.transferModalVisible = false;
            this.message.success(this.i18n.fanyi('flow.success.transfer'));
            this.transferModalVisible = false;
            this.reason = null;
            this.transferUser = null;
            this.onReloadFlows();
        })
    }

    // Submit countersign
    submitAddSign() {
        if (!this.addSignType) {
            this.message.warning(this.i18n.fanyi('flow.warning.select_add_sign_type'));
            return;
        }

        if (this.addSignUsers.length === 0) {
            this.message.warning(this.i18n.fanyi('flow.warning.select_add_sign_user'));
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning(this.i18n.fanyi('flow.warning.fill_add_sign_reason'));
            return;
        }

        this.flowInstanceApiService.addSign(this.instanceDetail.taskId, this.addSignType, this.addSignUsers, this.reason).subscribe(res => {
            this.message.success(this.i18n.fanyi('flow.success.add_sign'));
            this.addSignModalVisible = false;
            this.onReloadFlows();
        })

    }


    // Submit return
    submitReturn() {
        if (!this.returnNode) {
            this.message.warning(this.i18n.fanyi('flow.warning.select_return_node'));
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning(this.i18n.fanyi('flow.warning.fill_return_reason'));
            return;
        }

        this.flowInstanceApiService.rollback(this.instanceDetail.taskId, this.returnNode, this.reason).subscribe(res => {
            this.message.success(this.i18n.fanyi('flow.success.return'));
            this.returnModalVisible = false;
            this.reason = null;
            this.returnNode = null;
            this.onReloadFlows();
        })
    }

    // Transfer approval
    transfer() {
        this.transferUser = null;
        this.reason = null;
        this.loadAvailableUsers();
        this.transferModalVisible = true;
    }

    // Add countersigner
    addSigner() {
        this.addSignUsers = [];
        this.reason = null;
        this.addSignType = AddSignType.PRE_SIGN;
        this.loadAvailableUsers();
        this.addSignModalVisible = true;
    }

    // Return approval
    return() {
        this.returnNode = null;
        this.reason = null;
        this.returnModalVisible = true;
        this.flowInstanceApiService.availableReturnNodes(this.instanceDetail.taskId).subscribe({
            next: (data) => {
                this.availableReturnNodes = data.data || [];
            }
        })
    }

    // Resubmit / Submit
    resubmit() {
        this.reason = null;
        this.selfSelectNodes = [];
        this.nodeUsersOptions = {};
        this.selectedNodeUserIds = {};
        this.resubmitModalVisible = true;
        // Self-select nodes only need to be loaded on first submission
        if (this.instanceDetail?.eruptModelId) return;
        this.loadingSelfSelectNodes = true;
        const flowId = this.instanceDetail.eruptFlowConfig.id;
        this.flowApiService.selfSelectNodes(flowId).subscribe({
            next: (nodeRes) => {
                this.selfSelectNodes = nodeRes.data || [];
                if (this.selfSelectNodes.length === 0) {
                    this.loadingSelfSelectNodes = false;
                    return;
                }
                forkJoin(this.selfSelectNodes.map(node => this.flowApiService.selfSelectNodeUsers(flowId, node.key)))
                    .subscribe({
                        next: (userResults) => {
                            userResults.forEach((res, i) => {
                                this.nodeUsersOptions[this.selfSelectNodes[i].key] = res.data;
                            });
                        },
                        complete: () => { this.loadingSelfSelectNodes = false; },
                        error: () => { this.loadingSelfSelectNodes = false; }
                    });
            },
            error: () => { this.loadingSelfSelectNodes = false; }
        });
    }

    // Submit resubmit / Submit
    submitResubmit() {
        for (let node of this.selfSelectNodes) {
            if (!this.selectedNodeUserIds[node.key] || this.selectedNodeUserIds[node.key].length === 0) {
                this.message.warning(this.i18n.fanyi('flow.warning.select_approver_prefix') + node.value + this.i18n.fanyi('flow.warning.select_approver_suffix'));
                return;
            }
        }
        const selfSelectNodeUsers: Record<string, number[]> = {};
        for (const key in this.selectedNodeUserIds) {
            selfSelectNodeUsers[key] = this.selectedNodeUserIds[key];
        }
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.flowInstanceApiService.resubmit(this.instanceDetail.taskId, this.reason, data,
            this.selfSelectNodes.length ? selfSelectNodeUsers : null).subscribe(res => {
            this.resubmitModalVisible = false;
            this.reason = null;
            this.message.success(this.i18n.fanyi('flow.success.submit'));
            this.onReloadFlows();
        })
    }

    modify() {
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.flowInstanceApiService.updateData(this.selectedInstance.id, data).subscribe({
            next: (data) => {
                this.message.success(this.i18n.fanyi('global.update.success'));
                this.getDataHistories(this.selectedInstance.id);
            }
        })
    }

    getDataHistories(instanceId: number) {
        this.flowInstanceApiService.dataHistories(instanceId).subscribe({
            next: (data) => {
                this.dataHistories = data.data;
            }
        })
    }


    copyToClipboard(no: string) {
        if (!no) return;
        navigator.clipboard.writeText(no).then(() => {
            this.message.success(this.i18n.fanyi('flow.success.no_copied'));
        });
    }

    withdraw() {
        this.flowInstanceApiService.withdraw(this.selectedInstance.id, this.i18n.fanyi('flow.action.withdraw')).subscribe({
            next: (data) => {
                this.message.success(this.i18n.fanyi('flow.success.withdraw'));
                this.onReloadFlows();
            }
        })
    }

    urge() {
        this.flowInstanceApiService.urge(this.selectedInstance.id, this.i18n.fanyi('flow.action.urge')).subscribe({
            next: (data) => {
                this.message.success(this.i18n.fanyi('flow.success.urge'));
                this.loadInstanceDetail(this.selectedInstance);
            }
        })
    }

    onTabChange(index: number) {
        this.activeTabIndex = index;
        if (this.selectedInstance) {
            if (this.activeTabIndex === 0) {
                this.flowApiService.eruptFlowBuild(this.instanceDetail.erupt).subscribe({
                    next: res => {
                        this.eruptBuild = null;
                        this.loadingEruptData = true;
                        this.flowInstanceApiService.eruptData(this.selectedInstance.id).subscribe({
                            next: eruptDataRes => {
                                this.dataHandlerService.initErupt(res.data)
                                if (eruptDataRes.success) {
                                    this.dataHandlerService.objectToEruptValue(eruptDataRes.data, res.data);
                                    this.dataDeleted = false;
                                } else {
                                    this.dataDeleted = true;
                                }
                                this.eruptBuild = res.data;
                                setTimeout(() => {
                                    this.loadingEruptData = false;
                                }, 100)
                                this.cdr.detectChanges();
                            }
                        })
                    }
                })

            } else if (this.activeTabIndex === 1) {
                // Load task list
                this.flowInstanceApiService.tasks(this.selectedInstance.id).subscribe({
                    next: (data) => {
                        const arr = data.data || [];
                        for (let i = 0; i < arr.length;) {
                            if (!arr[i].nodeId) {
                                i++;
                                continue;
                            }
                            let span = 1;
                            while (i + span < arr.length && arr[i + span].nodeId === arr[i].nodeId) {
                                span++;
                            }
                            if (span > 1) {
                                arr[i].nodeRowspan = span;
                                for (let j = 1; j < span; j++) arr[i + j].nodeId = '';
                            }
                            i += span;
                        }
                        this.instanceTasks = arr;
                    }
                });
            } else if (this.activeTabIndex === 2) {
                this.flowInstanceApiService.commentList(this.selectedInstance.id).subscribe({
                    next: (data) => {
                        this.comments = data.data || [];
                    }
                });
            } else if (this.activeTabIndex === 3) {
                this.getDataHistories(this.selectedInstance.id);
            }
        }
    }


    // New method: submit a comment
    submitComment() {
        if (!this.newComment.trim() || !this.selectedInstance?.id) {
            return;
        }

        this.isSubmittingComment = true;
        this.flowInstanceApiService.commentCreate(Number(this.selectedInstance.id), this.newComment).subscribe({
            next: () => {
                this.message.success(this.i18n.fanyi('flow.success.comment'));
                this.newComment = '';
                // Reload comment list
                if (this.selectedInstance?.id) {
                    this.flowInstanceApiService.commentList(Number(this.selectedInstance.id)).subscribe(data => {
                        this.comments = data.data || [];
                    });
                }
            },
            complete: () => {
                this.isSubmittingComment = false;
            }
        });
    }

    openSign() {
        this.modal.create({
            nzDraggable: true,
            nzTitle: this.i18n.fanyi('flow.modal.signature'),
            nzContent: SignaturePadComponent,
            nzMaskClosable: false,
            nzWidth: '50%',
            nzOkText: this.i18n.fanyi('global.save'),
            nzCancelText: this.i18n.fanyi('global.cancel'),
            nzOnOk: (sign: SignaturePadComponent) => {
                this.approveSignature = sign.getSign();
            },
            nzOnCancel: () => {

            }
        });
    }

    // New method: view the flow diagram
    viewFlow() {
        let ref = this.drawerService.create({
            nzTitle: this.i18n.fanyi('flow.action.view_flow'),
            nzContent: EruptFlowComponent,
            nzContentParams: {
                eruptBuild: this.eruptBuild,
                modelValue: this.selectedInstance.rule,
                readonly: true
            },
            nzBodyStyle: {
                padding: '0',
                background: 'rgb(245 245 245)'
            },
            nzPlacement: 'bottom',
            nzHeight: '85%',
            nzFooter: null
        })
        this.flowInstanceApiService.progress(this.selectedInstance.id).subscribe(res => {
            ref.getContentComponent().progress = res.data;
        })
    }

    showDiff(history: FlowInstanceDataHistory) {
        let ref = this.modal.create({
            nzDraggable: true,
            nzTitle: this.i18n.fanyi('flow.action.change_detail'),
            nzContent: NzCodeEditorComponent,
            nzBodyStyle: {
                height: '500px'
            },
            nzWidth: '60%',
            nzFooter: null,
            nzCancelText: null
        });
        ref.componentInstance.nzEditorMode = 'diff';
        ref.componentInstance.nzEditorOption = {language: 'json', readOnly: true};
        ref.componentInstance.nzOriginalText = history.beforeData;
        ref.componentInstance.writeValue(history.afterData);
    }

    loadAvailableUsers() {
        this.upmsApiService.users().subscribe((data) => {
                this.availableUsers = data.data;
            }
        );
    }

    copyLink() {
        let link = location.origin + "/#/fill/flow/approval-detail/" + this.selectedInstance.no;
        navigator.clipboard.writeText(link).then(() => {
            this.message.success(this.i18n.fanyi('flow.success.link_copied'));
        });
    }

    // Print preview feature
    print() {
        const modalRef = this.modal.create({
            nzDraggable: true,
            nzTitle: this.i18n.fanyi("print.preview"),
            nzContent: FlowPrintPreviewComponent,
            nzWidth: '700px',
            nzStyle: {top: "30px"},
            nzOkText: this.i18n.fanyi("global.print"),
            nzOnOk: () => {
                (modalRef.componentInstance as FlowPrintPreviewComponent).print();
            },
            nzBodyStyle: {
                maxHeight: "75vh",
                padding: '0',
                overflow: 'auto'
            }
        });
        modalRef.componentInstance.instance = this.selectedInstance;
        modalRef.componentInstance.tasks = this.instanceTasks;
        modalRef.componentInstance.eruptBuild = this.eruptBuild;
    }

    protected readonly AddSignType = AddSignType;

    protected readonly ApprovalView = ApprovalView;

    protected readonly Object = Object;

    protected readonly getAvatarColor = getAvatarColor;

    protected readonly FormAccessEnum = FormAccessEnum;

    protected readonly NodeType = NodeType;

    protected readonly PrintSetting = PrintSetting;

    protected readonly InstanceStatus = InstanceStatus;

    protected readonly TaskType = TaskType;

}
