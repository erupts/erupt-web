import {Component, HostListener, OnInit} from '@angular/core';
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

interface MenuItem {
  key: string;
  title: string;
  icon?: string;
  children?: MenuItem[];
  count?: number;
  disabled?: boolean;
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
  selectedMenuKeys: string[] = ['todo'];

  // 移动端相关属性
  isMobile = false;
  isTablet = false;
  windowWidth = 0;

  constructor(
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  // 菜单数据
  menuItems: MenuItem[] = [
    {
      key: 'todo',
      title: '待办',
      icon: 'clock-circle',
      count: 5
    },
    {
      key: 'done',
      title: '已办',
      icon: 'check-circle',
      children: [
        { key: 'done-purchase', title: '采购申请' },
        { key: 'done-expense', title: '费用报销' }
      ]
    },
    {
      key: 'cc',
      title: '抄送我',
      icon: 'copy',
      count: 2
    },
    {
      key: 'initiated',
      title: '已发起',
      icon: 'rocket',
      children: [
        { key: 'initiated-purchase', title: '采购申请' },
        { key: 'initiated-expense', title: '费用报销' }
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
    this.checkScreenSize();
  }

  // 监听窗口大小变化
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  // 检查屏幕尺寸
  private checkScreenSize() {
    this.windowWidth = window.innerWidth;
    this.isMobile = this.windowWidth <= 768;
    this.isTablet = this.windowWidth > 768 && this.windowWidth <= 1200;

    // 移动端自动收起侧边栏
    if (this.isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
    }
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

  onMenuClick(event: any) {
    this.selectedMenuKeys = [event.key];
    console.log('菜单点击:', event.key);
    // 这里可以根据菜单项加载对应的数据
    this.loadDataByMenuKey(event.key);
  }

  loadDataByMenuKey(menuKey: string) {
    // 根据菜单项加载对应的审批列表数据
    switch (menuKey) {
      case 'todo':
        // 加载待办数据
        break;
      case 'done-purchase':
      case 'done-expense':
        // 加载已办数据
        break;
      case 'cc':
        // 加载抄送数据
        break;
      case 'initiated-purchase':
      case 'initiated-expense':
        // 加载已发起数据
        break;
    }
  }

  // 移动端优化方法
  onMobileItemSelect(item: ApprovalItem) {
    this.selectItem(item);
    // 移动端选择项目后可以添加额外的交互逻辑
    if (this.isMobile) {
      this.message.info('已选择审批项目');
    }
  }

  // 移动端手势支持
  onSwipeLeft() {
    if (this.isMobile && this.selectedItem) {
      // 左滑可以执行某些操作，比如拒绝
      this.reject();
    }
  }

  onSwipeRight() {
    if (this.isMobile && this.selectedItem) {
      // 右滑可以执行某些操作，比如同意
      this.approve();
    }
  }
}
