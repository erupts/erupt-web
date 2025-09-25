import {Component, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {ApprovalView, FlowInstance, FlowInstanceComment, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlowApiService} from "@flow/service/flow-api.service";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";
import {SignaturePadComponent} from "../../../erupt/components/signature-pad/signature-pad.component";
import {EruptFlowComponent} from "@flow/components/erupt-flow/erupt-flow.component";


@Component({
    selector: 'app-flow-approval',
    templateUrl: './flow-approval.component.html',
    styleUrls: ['./flow-approval.component.less']
})
export class FlowApprovalComponent implements OnInit {

    sidebarCollapsed = false;

    activeTabIndex = 0;

    selectedView: ApprovalView = ApprovalView.TODO;

    todoCount: number = 0

    // 调整为 FlowInstanceTask[] 类型
    flowInstanceTask: FlowInstanceTask[] = [];

    selectedInstanceTask: FlowInstanceTask;

    // 新增属性存储接口返回的数据
    instanceDetail: FlowInstance = null;
    instanceTasks: FlowInstanceTask[] = [];
    nodeInfo: NodeRule | null = null;
    comments: FlowInstanceComment[] = [];

    // 评论相关
    newComment: string = '';
    isSubmittingComment = false;

    eruptBuild: EruptBuildModel

    // 弹窗相关属性
    approveModalVisible = false;
    rejectModalVisible = false;
    ccModalVisible = false;
    transferModalVisible = false;
    addSignModalVisible = false;
    returnModalVisible = false;

    // 表单数据
    approveReason = '';
    approveSignature: string = null;

    rejectReason = '';
    ccReason = '';
    ccUsers: number[] = [];
    transferUser: number | null = null;
    transferReason = '';
    addSignUsers: number[] = [];
    addSignReason = '';
    addSignType: 'before' | 'after' = 'before';
    returnNode: number | null = null;
    returnReason = '';

    // 可用用户列表（用于抄送选择）
    availableUsers: any[] = [];
    // 可用退回节点列表
    availableReturnNodes: any[] = [];

    constructor(
        private message: NzMessageService,
        private flowInstanceApiService: FlowInstanceApiService,
        private modal: NzModalService,
        private upmsApiService: FlowUpmsApiService,
        private flowApiService: FlowApiService,
        private dataHandlerService: DataHandlerService
    ) {
    }

    ngOnInit() {
        this.onSwitchView(ApprovalView.TODO);
    }

    // 调整参数类型为 FlowInstanceTask
    selectItem(task: FlowInstanceTask) {
        this.selectedInstanceTask = task;
        if (task?.flowInstance?.id) {
            this.loadInstanceDetail(task);
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'processing':
                return 'processing';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    }

    // 新增方法：获取任务状态文本

    getAvatarColor(avatar: string): string {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#a8edea', '#fed6e3',
            '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'
        ];
        const index = avatar.charCodeAt(0) % colors.length;
        return colors[index];
    }

    // 同意审批
    approve() {
        if (!this.selectedInstanceTask) {
            this.message.warning('请先选择一个审批项目');
            return;
        }
        this.approveReason = '';
        this.approveModalVisible = true;
    }

    // 拒绝审批
    reject() {
        if (!this.selectedInstanceTask) {
            this.message.warning('请先选择一个审批项目');
            return;
        }
        this.rejectReason = '';
        this.rejectModalVisible = true;
    }

    // 抄送审批
    cc() {
        if (!this.selectedInstanceTask) {
            this.message.warning('请先选择一个审批项目');
            return;
        }
        this.ccReason = '';
        this.ccUsers = [];
        this.loadAvailableUsers();
        this.ccModalVisible = true;
    }

    // 提交同意
    submitApprove() {
        if (!this.approveReason.trim()) {
            this.message.warning('请填写同意原因');
            return;
        }

        this.approveModalVisible = true;
        this.flowInstanceApiService.agree(this.selectedInstanceTask.id, this.approveReason, this.approveSignature).subscribe(res => {
            this.approveModalVisible = false;
            this.approveReason = '';
            this.message.success('审批已同意');
            // 刷新数据
            if (this.selectedInstanceTask?.flowInstance?.id) {
                this.loadInstanceDetail(this.selectedInstanceTask);
            }
        })

    }

    // 提交拒绝
    submitReject() {
        if (!this.rejectReason.trim()) {
            this.message.warning('请填写拒绝原因');
            return;
        }
        this.approveModalVisible = true;
        this.flowInstanceApiService.refuse(this.selectedInstanceTask.id, this.approveReason).subscribe(res => {
            this.rejectModalVisible = false;
            this.rejectReason = '';
            this.message.success('审批已拒绝');
            // 刷新数据
            if (this.selectedInstanceTask?.flowInstance?.id) {
                this.loadInstanceDetail(this.selectedInstanceTask);
            }
        })
    }

    // 提交抄送
    submitCc() {
        if (this.ccUsers.length === 0) {
            this.message.warning('请选择抄送人员');
            return;
        }

        if (!this.ccReason.trim()) {
            this.message.warning('请填写抄送说明');
            return;
        }

        this.flowInstanceApiService.cc(this.selectedInstanceTask.id, this.ccUsers, this.ccReason).subscribe(res => {
            this.ccReason = '';
            this.ccUsers = [];
            this.ccModalVisible = false;
            this.message.success('抄送成功');
            // 刷新数据
            if (this.selectedInstanceTask?.flowInstance?.id) {
                this.loadInstanceDetail(this.selectedInstanceTask);
            }
        })
    }

    // 加载可用用户列表
    loadAvailableUsers() {
        // 调用获取用户列表接口
        this.upmsApiService.users().subscribe({
            next: (data) => {
                // 将KV<number, string>[]格式转换为{id: number, name: string}[]格式
                this.availableUsers = (data.data || []).map(user => ({
                    id: user.key,
                    name: user.value
                }));
            },
            error: (error) => {
                console.error('获取用户列表失败:', error);
                this.message.error('获取用户列表失败');
                // 如果接口失败，使用默认数据
                this.availableUsers = [
                    {id: 1, name: '张三'},
                    {id: 2, name: '李四'},
                    {id: 3, name: '王五'},
                    {id: 4, name: '赵六'}
                ];
            }
        });
    }

    // 加载可用退回节点列表
    loadAvailableReturnNodes() {
        // TODO: 调用获取可退回节点接口
        // 这里先模拟一些节点数据
        this.availableReturnNodes = [
            {id: 1, name: '部门经理审批'},
            {id: 2, name: '财务审核'},
            {id: 3, name: '总经理审批'}
        ];
    }

    // 提交转交
    submitTransfer() {
        if (!this.transferUser) {
            this.message.warning('请选择转交人员');
            return;
        }

        if (!this.transferReason.trim()) {
            this.message.warning('请填写转交说明');
            return;
        }

        // TODO: 调用转交接口
        console.log('转交审批:', {
            instanceTaskId: this.selectedInstanceTask?.flowInstance?.id,
            userId: this.transferUser,
            reason: this.transferReason
        });

        // 模拟接口调用
        this.message.success('转交成功');
        this.transferModalVisible = false;
        this.transferReason = '';
        this.transferUser = null;

        // 刷新数据
        if (this.selectedInstanceTask?.flowInstance?.id) {
            this.loadInstanceDetail(this.selectedInstanceTask);
        }
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

        if (!this.addSignReason.trim()) {
            this.message.warning('请填写加签说明');
            return;
        }

        // TODO: 调用加签接口
        console.log('加签审批:', {
            instanceTaskId: this.selectedInstanceTask?.flowInstance?.id,
            type: this.addSignType,
            users: this.addSignUsers,
            reason: this.addSignReason
        });

        // 模拟接口调用
        this.message.success('加签成功');
        this.addSignModalVisible = false;
        this.addSignReason = '';
        this.addSignUsers = [];
        this.addSignType = 'before';

        // 刷新数据
        if (this.selectedInstanceTask?.flowInstance?.id) {
            this.loadInstanceDetail(this.selectedInstanceTask);
        }
    }

    // 提交退回
    submitReturn() {
        if (!this.returnNode) {
            this.message.warning('请选择退回节点');
            return;
        }

        if (!this.returnReason.trim()) {
            this.message.warning('请填写退回说明');
            return;
        }

        // TODO: 调用退回接口
        console.log('退回审批:', {
            instanceTaskId: this.selectedInstanceTask?.flowInstance?.id,
            nodeId: this.returnNode,
            reason: this.returnReason
        });

        // 模拟接口调用
        this.message.success('退回成功');
        this.returnModalVisible = false;
        this.returnReason = '';
        this.returnNode = null;

        // 刷新数据
        if (this.selectedInstanceTask?.flowInstance?.id) {
            this.loadInstanceDetail(this.selectedInstanceTask);
        }
    }

    // 转交审批
    transfer() {
        if (!this.selectedInstanceTask) {
            this.message.warning('请先选择一个审批项目');
            return;
        }
        this.transferUser = null;
        this.transferReason = '';
        this.loadAvailableUsers();
        this.transferModalVisible = true;
    }

    // 加签审批
    addSigner() {
        if (!this.selectedInstanceTask) {
            this.message.warning('请先选择一个审批项目');
            return;
        }
        this.addSignUsers = [];
        this.addSignReason = '';
        this.addSignType = 'before';
        this.loadAvailableUsers();
        this.addSignModalVisible = true;
    }

    // 退回审批
    return() {
        if (!this.selectedInstanceTask) {
            this.message.warning('请先选择一个审批项目');
            return;
        }
        this.returnNode = null;
        this.returnReason = '';
        this.loadAvailableReturnNodes();
        this.returnModalVisible = true;
    }

    modify() {
        this.message.info('修改功能');
    }

    withdraw() {
        this.flowInstanceApiService.withdraw(this.selectedInstanceTask?.flowInstance?.id, '撤回').subscribe({
            next: (data) => {
                this.message.success('撤回成功');
                this.loadInstanceDetail(this.selectedInstanceTask);
            }
        })
    }

    resubmit() {
        this.message.info('再次提交功能');
    }


    copyToClipboard(no: string) {
        if (!no) return;
        navigator.clipboard.writeText(no).then(() => {
            this.message.success('编号已复制到剪贴板');
        }).catch(err => {
            this.message.error('复制失败，请手动复制');
            console.error('复制失败:', err);
        });
    }

    onTabChange(index: number) {
        this.activeTabIndex = index;
    }

    onSwitchView(view: ApprovalView) {
        this.selectedView = view;
        this.selectedInstanceTask = null;
        // 清空详情数据
        this.instanceDetail = null;
        this.instanceTasks = [];
        this.nodeInfo = null;
        this.comments = [];

        switch (view) {
            case ApprovalView.TODO:
                this.flowInstanceApiService.todoList().subscribe({
                    next: (data) => {
                        this.flowInstanceTask = data.data;
                        this.selectedInstanceTask = this.flowInstanceTask[0] || null;
                        this.selectedInstanceTask && this.selectItem(this.selectedInstanceTask);
                        this.todoCount = this.flowInstanceTask.length;
                    }
                });
                break;
            case ApprovalView.DONE:
                this.flowInstanceApiService.doneList().subscribe({
                    next: (data) => {
                        this.flowInstanceTask = data.data;
                        this.selectedInstanceTask = this.flowInstanceTask[0] || null;
                        this.selectedInstanceTask && this.selectItem(this.selectedInstanceTask);
                    }
                });
                break;
            case ApprovalView.CC:
                this.flowInstanceApiService.ccList().subscribe({
                    next: (data) => {
                        this.flowInstanceTask = data.data;
                        this.selectedInstanceTask = this.flowInstanceTask[0] || null;
                        this.selectedInstanceTask && this.selectItem(this.selectedInstanceTask);
                    }
                });
                break;
            case ApprovalView.CREATED:
                this.flowInstanceApiService.createdList().subscribe({
                    next: (data) => {
                        this.flowInstanceTask = data.data;
                        this.selectedInstanceTask = this.flowInstanceTask[0] || null;
                        this.selectedInstanceTask && this.selectItem(this.selectedInstanceTask);
                    }
                });
                break;
        }
    }

    // 新增方法：加载实例详情
    loadInstanceDetail(task: FlowInstanceTask) {
        // 加载实例详情
        this.flowInstanceApiService.detail(task.flowInstance.id).subscribe({
            next: (data) => {
                this.instanceDetail = data.data;
                this.flowApiService.eruptFlowBuild(this.instanceDetail.erupt).subscribe({
                    next: res => {
                        this.eruptBuild = null;
                        setTimeout(() => {
                            this.dataHandlerService.initErupt(res.data)
                            this.eruptBuild = res.data;
                            this.flowInstanceApiService.eruptData(task.flowInstance.id).subscribe({
                                next: res => {
                                    this.dataHandlerService.objectToEruptValue(res.data, this.eruptBuild);
                                }
                            })
                        }, 50)
                    }
                })
            }
        });

        // 加载任务列表
        this.flowInstanceApiService.tasks(task.flowInstance.id).subscribe({
            next: (data) => {
                this.instanceTasks = data.data || [];
            }
        });

        // 加载评论列表
        this.flowInstanceApiService.commentList(task.flowInstance.id).subscribe({
            next: (data) => {
                this.comments = data.data || [];
            }
        });

        // 加载节点信息
        if (task.id) {
            this.flowInstanceApiService.taskNodeInfo(task.id).subscribe({
                next: (data) => {
                    this.nodeInfo = data.data;
                }
            });
        }
    }

    // 新增方法：提交评论
    submitComment() {
        if (!this.newComment.trim() || !this.selectedInstanceTask?.flowInstance?.id) {
            return;
        }

        this.isSubmittingComment = true;
        this.flowInstanceApiService.commentCreate(Number(this.selectedInstanceTask.flowInstance.id), this.newComment).subscribe({
            next: () => {
                this.message.success('评论提交成功');
                this.newComment = '';
                // 重新加载评论列表
                if (this.selectedInstanceTask?.flowInstance?.id) {
                    this.flowInstanceApiService.commentList(Number(this.selectedInstanceTask.flowInstance.id)).subscribe(data => {
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
        if (this.selectedInstanceTask?.flowInstance?.id) {
            let ref = this.modal.create({
                nzTitle: '查看流程',
                nzContent: EruptFlowComponent,
                nzStyle:{
                    top: '12px'
                },
                nzBodyStyle: {
                    padding: '0',
                    background: 'rgb(245 245 245)'
                },
                nzWidth: '80%',
                nzFooter:null
            })
            ref.getContentComponent().eruptBuild = this.eruptBuild;
            ref.getContentComponent().modelValue = this.selectedInstanceTask?.flowInstance.rule;
            ref.getContentComponent().readonly = true;
        }
    }

    protected readonly ApprovalView = ApprovalView;
    protected readonly NodeType = NodeType;

}
