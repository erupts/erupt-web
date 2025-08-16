import {Component, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {ApprovalView, FlowInstance} from "@flow/model/approval.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";


interface ApprovalRecord {
    nodeName: string;
    approver: {
        name: string;
        avatar: string;
    };
    result: string;
    opinion: string;
    time: string;
}

@Component({
    selector: 'app-flow-approval',
    templateUrl: './flow-approval.component.html',
    styleUrls: ['./flow-approval.component.less']
})
export class FlowApprovalComponent implements OnInit {

    sidebarCollapsed = false;

    activeTabIndex = 0;

    selectedView: ApprovalView = ApprovalView.TODO;

    flowInstance: FlowInstance[] = [];

    selectedInstance: FlowInstance | null = null;

    constructor(
        private message: NzMessageService,
        private flowInstanceApiService: FlowInstanceApiService,
        private modal: NzModalService
    ) {
    }

    approvalRecords: ApprovalRecord[] = [
        {
            nodeName: '提交',
            approver: {
                name: '李月鹏',
                avatar: '月'
            },
            result: '已提交',
            opinion: '',
            time: '2天前'
        },
        {
            nodeName: '部门审批',
            approver: {
                name: '张经理',
                avatar: '张'
            },
            result: '已通过',
            opinion: '同意采购',
            time: '1天前'
        }
    ];

    ngOnInit() {
        this.onSwitchView(ApprovalView.TODO);
    }

    selectItem(instance: FlowInstance) {
        this.selectedInstance = instance;
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'processing':
                return '审批中';
            case 'approved':
                return '已通过';
            case 'rejected':
                return '已拒绝';
            case 'pending':
                return '待审批';
            default:
                return '';
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

    onTabChange(index: number) {
        this.activeTabIndex = index;
    }

    onSwitchView(view: ApprovalView) {
        this.selectedView = view;
        this.selectedInstance = null;
        switch (view) {
            case ApprovalView.TODO:
                this.flowInstanceApiService.todoList().subscribe(data => {
                    this.flowInstance = data.data;
                });
                break;
            case ApprovalView.DONE:
                this.flowInstanceApiService.doneList().subscribe(data => {
                    this.flowInstance = data.data;
                });
                break;
            case ApprovalView.CC:
                this.flowInstanceApiService.ccList().subscribe(data => {
                    this.flowInstance = data.data;
                })
                break;
            case ApprovalView.CREATED:
                this.flowInstanceApiService.createdList().subscribe(data => {
                    this.flowInstance = data.data;
                })
        }
    }

    protected readonly ApprovalView = ApprovalView;
}
