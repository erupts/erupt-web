import {Component, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';

interface ApprovalItem {
  id: string;
  type: string;
  reason: string;
  category: string;
  expectedDelivery?: string;
  amount: number;
  submitter: {
    name: string;
    avatar: string;
    department: string;
  };
  submitTime: string;
  processTime?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  priority: 'high' | 'medium' | 'low';
}

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

interface ExpenseDetail {
  name: string;
  specification: string;
  quantity: number;
  amount: number;
}

interface NavigationItem {
  title: string;
  icon?: string;
  children?: NavigationItem[];
  count?: number;
  active?: boolean;
}

@Component({
  selector: 'app-flow-approval',
  templateUrl: './flow-approval.component.html',
  styleUrls: ['./flow-approval.component.less']
})
export class FlowApprovalComponent implements OnInit {

  selectedItem: ApprovalItem | null = null;
  timeFilter = 'all';
  sidebarCollapsed = false;
  activeTabIndex = 0;

  constructor(
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  // 导航菜单数据
  navigationItems: NavigationItem[] = [
    {
      title: '待办',
      icon: 'clock-circle',
      count: 5
    },
    {
      title: '已办',
      icon: 'check-circle',
      children: [
        { title: '采购申请', active: true },
        { title: '费用报销' }
      ]
    },
    {
      title: '抄送我',
      icon: 'copy',
      count: 2
    },
    {
      title: '已发起',
      icon: 'rocket',
      children: [
        { title: '采购申请' },
        { title: '费用报销' }
      ]
    }
  ];

  approvalList: ApprovalItem[] = [
    {
      id: '202507280001',
      type: '采购申请',
      reason: '就解决',
      category: '办公用品',
      expectedDelivery: '2025年07月29日',
      amount: 7.00,
      submitter: {
        name: '李月鹏',
        avatar: '月',
        department: 'erupt'
      },
      submitTime: '7月28日 23:29',
      processTime: '07-30 22:51',
      status: 'approved',
      priority: 'medium'
    },
    {
      id: '202507280002',
      type: '费用报销',
      reason: '出差住宿费用报销',
      category: '差旅费',
      amount: 2222.00,
      submitter: {
        name: '张小明',
        avatar: '张',
        department: '销售部'
      },
      submitTime: '2小时前',
      status: 'processing',
      priority: 'high'
    },
    {
      id: '202507280003',
      type: '采购申请',
      reason: '办公设备采购',
      category: '办公用品',
      expectedDelivery: '2025年08月15日',
      amount: 3500.00,
      submitter: {
        name: '王丽华',
        avatar: '王',
        department: '行政部'
      },
      submitTime: '1天前',
      status: 'pending',
      priority: 'low'
    }
  ];

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

  expenseDetails: ExpenseDetail[] = [
    {
      name: '7',
      specification: '7',
      quantity: 7,
      amount: 7.00
    }
  ];

  ngOnInit() {
    this.selectedItem = this.approvalList[0];
  }

  selectItem(item: ApprovalItem) {
    this.selectedItem = item;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }



  getStatusClass(status: string): string {
    switch (status) {
      case 'processing': return 'status-processing';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'processing': return '审批中';
      case 'approved': return '已通过';
      case 'rejected': return '已拒绝';
      case 'pending': return '待审批';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'processing': return 'processing';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
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

  getTotalAmount(): number {
    return this.expenseDetails.reduce((sum, item) => sum + item.amount, 0);
  }

  getTotalQuantity(): number {
    return this.expenseDetails.reduce((sum, item) => sum + item.quantity, 0);
  }

  approve() {
    this.modal.confirm({
      nzTitle: '确认审批',
      nzContent: '确定同意此审批申请吗？',
      nzOkText: '确定',
      nzCancelText: '取消',
      nzOnOk: () => {
        this.message.success('审批已通过');
      }
    });
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

  startGroupChat() {
    this.message.info('发起群聊功能');
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
}
