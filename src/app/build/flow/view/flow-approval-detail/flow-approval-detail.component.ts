import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {ApprovalView, FlowInstance, FlowInstanceComment, FlowInstanceDataHistory, FlowInstanceTask} from "@flow/model/flow-instance.model";
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
import {AddSignType} from "@flow/model/fllw-approval.model";
import {KV} from "../../../erupt/model/util.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {getAvatarColor} from "@flow/util/flow.util";
import {ActivatedRoute} from "@angular/router";
import {FormAccessEnum} from "@flow/model/flow.model";

@Component({
    selector: 'flow-approval-detail',
    templateUrl: './flow-approval-detail.component.html',
    styleUrls: ['./flow-approval-detail.component.less']
})
export class FlowApprovalDetailComponent implements OnInit {

    activeTabIndex: number = 0;

    dataHistories: FlowInstanceDataHistory[] = [];

    // 新增属性存储接口返回的数据
    instanceDetail: FlowInstance = null;

    instanceTasks: FlowInstanceTask[] = [];

    nodeInfo: NodeRule | null = null;
    currTask: FlowInstanceTask = null;

    comments: FlowInstanceComment[] = [];

    // 评论相关
    newComment: string = '';
    isSubmittingComment: boolean = false;

    eruptBuild: EruptBuildModel


    // 弹窗相关属性
    approveModalVisible: boolean = false;
    rejectModalVisible: boolean = false;
    ccModalVisible: boolean = false;
    transferModalVisible: boolean = false;
    addSignModalVisible: boolean = false;
    returnModalVisible: boolean = false;
    resubmitModalVisible: boolean = false;

    reason: string;
    approveSignature: string = null;
    ccUsers: number[] = [];
    transferUser: number | null = null;
    addSignUsers: number[] = [];
    addSignType: AddSignType = AddSignType.PRE_SIGN;
    returnNode: string;

    availableUsers: KV<number, string>[] = [];
    availableReturnNodes: KV<string, string>[] = [];

    dataDeleted: boolean = false;

    @Input() selectedInstance: FlowInstance;

    @Input() approvalView: ApprovalView = ApprovalView.TODO;

    @Output() reloadFlows = new EventEmitter<void>();

    constructor(private modal: NzModalService,
                private message: NzMessageService,
                private upmsApiService: FlowUpmsApiService,
                private flowApiService: FlowApiService,
                private dataHandlerService: DataHandlerService,
                private flowInstanceApiService: FlowInstanceApiService,
                @Inject(NzDrawerService) private drawerService: NzDrawerService,
                private route: ActivatedRoute) {
        const no = this.route.snapshot.paramMap.get('no');
        if (no) {
            flowInstanceApiService.detail(no).subscribe({
                next: (res) => {
                    this.onSelectFlow(ApprovalView.ADMIN, res.data);
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

    // 新增方法：加载实例详情
    loadInstanceDetail(flow: FlowInstance, reloadLoadFlows: boolean = false) {
        reloadLoadFlows && this.reloadFlows.emit();
        // 加载实例详情
        this.flowInstanceApiService.detail(flow.no).subscribe({
            next: (data) => {
                this.instanceDetail = data.data;
                this.flowApiService.eruptFlowBuild(this.instanceDetail.erupt).subscribe({
                    next: res => {
                        this.eruptBuild = null;
                        setTimeout(() => {
                            this.dataHandlerService.initErupt(res.data)
                            this.eruptBuild = res.data;
                            this.flowInstanceApiService.eruptData(flow.id).subscribe({
                                next: res => {
                                    if (res.success) {
                                        this.dataHandlerService.objectToEruptValue(res.data, this.eruptBuild);
                                        this.dataDeleted = false;
                                    } else {
                                        this.dataDeleted = true;
                                    }
                                }
                            })
                        }, 30)
                    }
                })
            }
        });

        // 加载任务列表
        this.flowInstanceApiService.tasks(flow.id).subscribe({
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

        // 加载评论列表
        this.flowInstanceApiService.commentList(flow.id).subscribe({
            next: (data) => {
                this.comments = data.data || [];
            }
        });

        this.getDataHistories(flow.id);
        if (this.approvalView == ApprovalView.TODO) {
            this.flowInstanceApiService.currTask(flow.id, this.approvalView).subscribe({
                next: (res) => {
                    this.currTask = res.data;
                    this.flowInstanceApiService.taskNodeInfo(res.data.id).subscribe({
                        next: (data) => {
                            this.nodeInfo = data.data;
                        }
                    });
                }
            });
        }
    }


    // 同意审批
    approve() {
        this.reason = null;
        this.approveModalVisible = true;
    }

    // 拒绝审批
    reject() {
        this.reason = null;
        this.rejectModalVisible = true;
    }

    // 抄送审批
    cc() {
        this.reason = null;
        this.ccUsers = [];
        this.loadAvailableUsers();
        this.ccModalVisible = true;
    }

    // 提交同意
    submitApprove() {
        if (this.nodeInfo?.prop?.requireApprovalNote && !this.reason?.trim()) {
            this.message.warning('请填写同意原因');
            return;
        }
        this.approveModalVisible = true;
        let data;
        if (Object.keys(this.nodeInfo?.prop?.formAccesses || {}).length) {
            data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        }
        this.flowInstanceApiService.agree(this.currTask.id, this.reason, this.approveSignature, data).subscribe(res => {
            this.approveModalVisible = false;
            this.reason = null;
            this.message.success('审批已同意');
            this.selectedInstance = null;
            this.loadInstanceDetail(this.selectedInstance, true);
        })

    }

    // 提交拒绝
    submitReject() {
        if (!this.reason?.trim()) {
            this.message.warning('请填写拒绝原因');
            return;
        }
        this.flowInstanceApiService.refuse(this.currTask.id, this.reason).subscribe(res => {
            this.rejectModalVisible = false;
            this.reason = null;
            this.message.success('审批已拒绝');
            this.selectedInstance = null;
            this.loadInstanceDetail(this.selectedInstance, true);
        })
    }

    // 提交抄送
    submitCc() {
        if (this.ccUsers.length === 0) {
            this.message.warning('请选择抄送人员');
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning('请填写抄送说明');
            return;
        }

        this.flowInstanceApiService.cc(this.currTask.id, this.ccUsers, this.reason).subscribe(res => {
            this.reason = null;
            this.ccUsers = [];
            this.ccModalVisible = false;
            this.message.success('抄送成功');
            // 刷新数据
            if (this.selectedInstance?.id) {
                this.loadInstanceDetail(this.selectedInstance);
            }
        })
    }


    // 提交转交
    submitTransfer() {
        if (!this.transferUser) {
            this.message.warning('请选择转交人员');
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning('请填写转交说明');
            return;
        }

        this.flowInstanceApiService.transfer(this.currTask.id, this.transferUser, this.reason).subscribe(res => {
            this.transferModalVisible = false;
            // 模拟接口调用
            this.message.success('转交成功');
            this.transferModalVisible = false;
            this.reason = null;
            this.transferUser = null;

            // 刷新数据
            if (this.selectedInstance?.id) {
                this.loadInstanceDetail(this.selectedInstance);
            }
        })
    }

    // 提交加签
    submitAddSign() {
        if (!this.addSignType) {
            this.message.warning('请选择加签类型');
            return;
        }

        if (this.addSignUsers.length === 0) {
            this.message.warning('请选择加签人员');
            return;
        }

        if (!this.reason?.trim()) {
            this.message.warning('请填写加签说明');
            return;
        }

        this.flowInstanceApiService.addSign(this.currTask.id, this.addSignType, this.addSignUsers, this.reason).subscribe(res => {
            this.message.success('加签成功');
            this.addSignModalVisible = false;
            if (this.selectedInstance?.id) {
                this.loadInstanceDetail(this.selectedInstance);
            }
        })

    }


    // 提交退回
    submitReturn() {
        if (!this.returnNode) {
            this.message.warning('请选择退回节点');
            return;
        }

        if (!this.reason.trim()) {
            this.message.warning('请填写退回说明');
            return;
        }

        this.flowInstanceApiService.rollback(this.currTask.id, this.returnNode, this.reason).subscribe(res => {
            this.message.success('退回成功');
            this.returnModalVisible = false;
            this.reason = null;
            this.returnNode = null;
            this.loadInstanceDetail(this.selectedInstance);
        })
    }

    // 转交审批
    transfer() {
        this.transferUser = null;
        this.reason = null;
        this.loadAvailableUsers();
        this.transferModalVisible = true;
    }

    // 加签审批
    addSigner() {
        this.addSignUsers = [];
        this.reason = null;
        this.addSignType = AddSignType.PRE_SIGN;
        this.loadAvailableUsers();
        this.addSignModalVisible = true;
    }

    // 退回审批
    return() {
        this.returnNode = null;
        this.reason = null;
        this.returnModalVisible = true;
        this.flowInstanceApiService.availableReturnNodes(this.currTask.id).subscribe({
            next: (data) => {
                this.availableReturnNodes = data.data || [];
            }
        })
    }

    // 重新提交
    resubmit() {
        this.reason = null;
        this.resubmitModalVisible = true;
    }

    // 提交重新提交
    submitResubmit() {
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.flowInstanceApiService.resubmit(this.currTask.id, this.reason, data).subscribe(res => {
            this.resubmitModalVisible = false;
            this.reason = null;
            this.message.success('提交成功');
            this.selectedInstance = null;
            this.loadInstanceDetail(this.selectedInstance, true);
        })
    }

    modify() {
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.flowInstanceApiService.updateData(this.selectedInstance.id, data).subscribe({
            next: (data) => {
                this.message.success('修改成功');
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
            this.message.success('编号已复制到剪贴板');
        });
    }

    withdraw() {
        this.flowInstanceApiService.withdraw(this.selectedInstance.id, '撤回').subscribe({
            next: (data) => {
                this.message.success('撤回成功');
                this.loadInstanceDetail(this.selectedInstance);
            }
        })
    }

    urge() {
        this.flowInstanceApiService.urge(this.selectedInstance.id, '催办').subscribe({
            next: (data) => {
                this.message.success('催办成功');
                this.loadInstanceDetail(this.selectedInstance);
            }
        })
    }

    onTabChange(index: number) {
        this.activeTabIndex = index;
    }


    // 新增方法：提交评论
    submitComment() {
        if (!this.newComment.trim() || !this.selectedInstance?.id) {
            return;
        }

        this.isSubmittingComment = true;
        this.flowInstanceApiService.commentCreate(Number(this.selectedInstance.id), this.newComment).subscribe({
            next: () => {
                this.message.success('评论提交成功');
                this.newComment = '';
                // 重新加载评论列表
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
            nzTitle: '签名',
            nzContent: SignaturePadComponent,
            nzMaskClosable: false,
            nzWidth: '50%',
            nzOkText: '保存',
            nzCancelText: '取消',
            nzOnOk: (sign: SignaturePadComponent) => {
                this.approveSignature = sign.getSign();
            },
            nzOnCancel: () => {

            }
        });
    }

    // 新增方法：查看流程图
    viewFlow() {
        let ref = this.drawerService.create({
            nzTitle: '查看流程',
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
            nzTitle: '变更详情',
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
            this.message.success('地址已复制到剪贴板');
        });
    }

    protected readonly AddSignType = AddSignType;

    protected readonly ApprovalView = ApprovalView;

    protected readonly Object = Object;

    protected readonly getAvatarColor = getAvatarColor;

    protected readonly FormAccessEnum = FormAccessEnum;

    protected readonly NodeType = NodeType;

}
