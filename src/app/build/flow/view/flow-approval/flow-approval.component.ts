import {Component, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {ApprovalView, FlowInstance, FlowInstanceComment, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlowApiService} from "@flow/service/flow-api.service";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";


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

    flowInstance: FlowInstance[] = [];

    selectedInstance: FlowInstance | null = null;

    // 新增属性存储接口返回的数据
    instanceDetail: FlowInstance = null;
    instanceTasks: FlowInstanceTask[] = [];
    nodeInfo: NodeRule | null = null;
    comments: FlowInstanceComment[] = [];

    // 评论相关
    newComment: string = '';
    isSubmittingComment = false;

    eruptBuild: EruptBuildModel

    constructor(
        private message: NzMessageService,
        private flowInstanceApiService: FlowInstanceApiService,
        private modal: NzModalService,
        private flowApiService: FlowApiService,
        private dataHandlerService: DataHandlerService
    ) {
    }

    ngOnInit() {
        this.onSwitchView(ApprovalView.TODO);
    }

    selectItem(instance: FlowInstance) {
        this.selectedInstance = instance;
        if (instance && instance.id) {
            this.loadInstanceDetail(instance.id);
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
    getTaskStatusText(status: string): string {
        switch (status) {
            case 'pending':
                return '待处理';
            case 'processing':
                return '处理中';
            case 'completed':
                return '已完成';
            case 'cancelled':
                return '已取消';
            default:
                return status || '未知';
        }
    }

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

    reject() {
        this.modal.confirm({
            nzTitle: '拒绝审批',
            nzContent: '确定拒绝此审批申请吗？',
            nzOkText: '确定',
            nzCancelText: '取消',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzOnOk: () => {
                this.message.error('审批已拒绝');
            }
        });
    }

    cc() {
        this.message.info('抄送功能');
    }

    transfer() {
        this.message.info('转交功能');
    }

    addSigner() {
        this.message.info('加签功能');
    }

    return() {
        this.message.info('退回功能');
    }

    modify() {
        this.message.info('修改功能');
    }

    recall() {
        this.message.info('撤回功能');
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
        this.selectedInstance = null;
        // 清空详情数据
        this.instanceDetail = null;
        this.instanceTasks = [];
        this.nodeInfo = null;
        this.comments = [];

        switch (view) {
            case ApprovalView.TODO:
                this.flowInstanceApiService.todoList().subscribe({
                    next: (data) => {
                        this.flowInstance = data.data;
                        this.selectedInstance = this.flowInstance[0] || null;
                        this.selectedInstance && this.selectItem(this.selectedInstance);
                        this.todoCount = this.flowInstance.length;
                    }
                });
                break;
            case ApprovalView.DONE:
                this.flowInstanceApiService.doneList().subscribe({
                    next: (data) => {
                        this.flowInstance = data.data;
                        this.selectedInstance = this.flowInstance[0] || null;
                        this.selectedInstance && this.selectItem(this.selectedInstance);
                    }
                });
                break;
            case ApprovalView.CC:
                this.flowInstanceApiService.ccList().subscribe({
                    next: (data) => {
                        this.flowInstance = data.data;
                        this.selectedInstance = this.flowInstance[0] || null;
                        this.selectedInstance && this.selectItem(this.selectedInstance);
                    }
                });
                break;
            case ApprovalView.CREATED:
                this.flowInstanceApiService.createdList().subscribe({
                    next: (data) => {
                        this.flowInstance = data.data;
                        this.selectedInstance = this.flowInstance[0] || null;
                        this.selectedInstance && this.selectItem(this.selectedInstance);
                    }
                });
                break;
        }
    }

    // 新增方法：加载实例详情
    loadInstanceDetail(instanceId: number) {
        // 加载实例详情
        this.flowInstanceApiService.detail(instanceId).subscribe({
            next: (data) => {
                this.instanceDetail = data.data;
                this.flowApiService.eruptFlowBuild(this.instanceDetail.erupt).subscribe({
                    next: res => {
                        this.eruptBuild = res.data;
                        this.flowInstanceApiService.eruptData(instanceId).subscribe({
                            next: res => {
                                this.dataHandlerService.objectToEruptValue(res.data, this.eruptBuild);
                            }
                        })
                    },
                    complete: () => {
                    }
                })
            }
        });

        // 加载任务列表
        this.flowInstanceApiService.tasks(instanceId).subscribe({
            next: (data) => {
                this.instanceTasks = data.data || [];
            }
        });

        // 加载节点信息
        this.flowInstanceApiService.nodeInfo(instanceId).subscribe({
            next: (data) => {
                this.nodeInfo = data.data;
            }
        });

        // 加载评论列表
        this.flowInstanceApiService.commentList(Number(instanceId)).subscribe({
            next: (data) => {
                this.comments = data.data || [];
            }
        });
    }

    // 新增方法：提交评论
    submitComment() {
        if (!this.newComment.trim() || !this.selectedInstance) {
            return;
        }

        this.isSubmittingComment = true;
        this.flowInstanceApiService.commentCreate(Number(this.selectedInstance.id), this.newComment).subscribe({
            next: () => {
                this.message.success('评论提交成功');
                this.newComment = '';
                // 重新加载评论列表
                if (this.selectedInstance) {
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

    protected readonly ApprovalView = ApprovalView;
    protected readonly NodeType = NodeType;
}
