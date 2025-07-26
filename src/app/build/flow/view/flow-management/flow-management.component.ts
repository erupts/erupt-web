import {Component, OnInit} from '@angular/core';

interface FlowApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  category: string;
  visible: boolean;
  disabled: boolean;
  status?: string;
}

@Component({
  selector: 'erupt-flow-management',
  templateUrl: './flow-management.component.html',
  styleUrls: ['./flow-management.component.less']
})
export class FlowManagementComponent implements OnInit {

  searchValue = '';
  flowApps: FlowApp[] = [];
  categories: string[] = [];
  selectedCategory = '';
  filteredApps: FlowApp[] = [];

  constructor() {}

  ngOnInit(): void {
    this.initData();
  }

  initData(): void {
    this.flowApps = [
      {
        id: '1',
        name: '采购申请',
        description: '各类办公、活动用品采购',
        icon: 'shopping-cart',
        iconColor: '#1890ff',
        category: '财务',
        visible: true,
        disabled: false
      },
      {
        id: '2',
        name: '费用报销',
        description: '差旅费、团建费等各类报销',
        icon: 'dollar',
        iconColor: '#52c41a',
        category: '财务',
        visible: true,
        disabled: true,
        status: '已停用'
      },
      {
        id: '3',
        name: '付款申请',
        description: '现金、支票等各类(对公)付款申请',
        icon: 'bank',
        iconColor: '#13c2c2',
        category: '财务',
        visible: true,
        disabled: false
      },
      {
        id: '4',
        name: '合同申请',
        description: '用于合同签订申请',
        icon: 'file-text',
        iconColor: '#fa8c16',
        category: '财务',
        visible: true,
        disabled: false
      },
      {
        id: '5',
        name: '立项申请',
        description: '用于项目立项申请',
        icon: 'project',
        iconColor: '#1890ff',
        category: '项目',
        visible: true,
        disabled: false
      },
      {
        id: '6',
        name: '活动经费申请',
        description: '用于开展活动所需经费的申请、费用申请',
        icon: 'car',
        iconColor: '#fa8c16',
        category: '财务',
        visible: true,
        disabled: false
      },
      {
        id: '7',
        name: '备用金申请',
        description: '申请预支备用金、申请借款',
        icon: 'wallet',
        iconColor: '#1890ff',
        category: '财务',
        visible: true,
        disabled: false
      },
      {
        id: '8',
        name: '项目进度报告',
        description: '项目进度汇报和状态更新',
        icon: 'bar-chart',
        iconColor: '#722ed1',
        category: '项目',
        visible: true,
        disabled: false
      },
      {
        id: '9',
        name: '资源调配申请',
        description: '人力资源和设备资源调配',
        icon: 'team',
        iconColor: '#eb2f96',
        category: '项目',
        visible: true,
        disabled: false
      },
      {
        id: '10',
        name: '请假申请',
        description: '年假、病假、事假等各类请假',
        icon: 'calendar',
        iconColor: '#52c41a',
        category: '人事',
        visible: true,
        disabled: false
      },
      {
        id: '11',
        name: '加班申请',
        description: '加班时间申请和审批',
        icon: 'clock-circle',
        iconColor: '#fa8c16',
        category: '人事',
        visible: true,
        disabled: false
      },
      {
        id: '12',
        name: '培训申请',
        description: '员工培训和学习申请',
        icon: 'book',
        iconColor: '#13c2c2',
        category: '人事',
        visible: true,
        disabled: false
      }
    ];

    this.categories = [...new Set(this.flowApps.map(app => app.category))];
  }

  getAppsByCategory(category: string): FlowApp[] {
    return this.flowApps.filter(app => app.category === category);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  getCurrentApps(): FlowApp[] {
    let apps = this.flowApps;

    // 按分类筛选
    if (this.selectedCategory) {
      apps = this.getAppsByCategory(this.selectedCategory);
    }

    // 按搜索关键词筛选
    if (this.searchValue.trim()) {
      const searchTerm = this.searchValue.toLowerCase().trim();
      apps = apps.filter(app =>
        app.name.toLowerCase().includes(searchTerm) ||
        app.description.toLowerCase().includes(searchTerm)
      );
    }

    return apps;
  }

  onSearch(): void {
    // 搜索功能已集成到 getCurrentApps 方法中
    console.log('搜索:', this.searchValue);
  }

  onCreateGroup(): void {
    console.log('创建分组');
  }

  onGroupSort(): void {
    console.log('分组排序');
  }

  onCreateApproval(): void {
    console.log('创建审批');
  }

  onEdit(app: FlowApp): void {
    console.log('编辑:', app.name);
  }

  onDuplicate(app: FlowApp): void {
    console.log('复制:', app.name);
  }

  onToggleVisibility(app: FlowApp): void {
    app.visible = !app.visible;
  }

  onDelete(app: FlowApp): void {
    console.log('删除:', app.name);
  }

  onMoreActions(app: FlowApp): void {
    console.log('更多操作:', app.name);
  }
}
