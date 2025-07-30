import {Component, OnDestroy, OnInit} from '@angular/core';

interface Flow {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'running' | 'completed' | 'stopped' | 'error';
  creator: string;
  createTime: Date;
  runCount: number;
  duration: number;
  category: string;
  group: string;
}

interface CategoryStats {
  total: number;
  active: number;
}

interface Category {
  key: string;
  name: string;
}

interface FlowGroup {
  title: string;
  flows: Flow[];
}

@Component({
  selector: 'app-flow-dashboard',
  templateUrl: './flow-dashboard.component.html',
  styleUrls: ['./flow-dashboard.component.less']
})
export class FlowDashboardComponent implements OnInit, OnDestroy {
  // 分类数据
  categories: Category[] = [
    { key: '', name: '全部' },
    { key: 'finance', name: '财务' },
    { key: 'attendance', name: '出勤' },
    { key: 'epidemic', name: '防疫专题' },
    { key: 'hr', name: '人事' },
    { key: 'admin', name: '行政' },
    { key: 'other', name: '其他服务商提供' }
  ];

  // 流程数据
  flows: Flow[] = [];

  // 选中的分类
  selectedCategory: string = '';

  // 缓存的流程分组数据
  private flowGroupsCache: FlowGroup[] = [];
  private categoryFlowGroupsCache: Map<string, FlowGroup[]> = new Map();

  ngOnInit(): void {
    this.initFlowData();
    this.updateFlowGroupsCache();
  }

  ngOnDestroy(): void {
    this.flowGroupsCache = [];
    this.categoryFlowGroupsCache.clear();
  }

  /**
   * 初始化流程数据
   */
  initFlowData(): void {
    this.flows = [
      // 财务流程
      {
        id: '1',
        name: '采购申请',
        description: '处理采购申请的审批流程',
        type: 'finance',
        status: 'running',
        creator: '张三',
        createTime: new Date('2024-01-15'),
        runCount: 45,
        duration: 30,
        category: 'finance',
        group: '采购管理'
      },
      {
        id: '2',
        name: '费用报销',
        description: '处理员工费用报销申请',
        type: 'finance',
        status: 'completed',
        creator: '李四',
        createTime: new Date('2024-01-10'),
        runCount: 128,
        duration: 45,
        category: 'finance',
        group: '费用管理'
      },
      {
        id: '3',
        name: '合同申请',
        description: '处理合同签订的审批流程',
        type: 'finance',
        status: 'running',
        creator: '王五',
        createTime: new Date('2024-01-12'),
        runCount: 67,
        duration: 120,
        category: 'finance',
        group: '合同管理'
      },
      {
        id: '4',
        name: '立项申请',
        description: '处理项目立项的审批流程',
        type: 'finance',
        status: 'stopped',
        creator: '赵六',
        createTime: new Date('2024-01-08'),
        runCount: 89,
        duration: 60,
        category: 'finance',
        group: '项目管理'
      },
      {
        id: '5',
        name: '活动经费申请',
        description: '处理活动经费的申请流程',
        type: 'finance',
        status: 'error',
        creator: '钱七',
        createTime: new Date('2024-01-05'),
        runCount: 234,
        duration: 15,
        category: 'finance',
        group: '活动管理'
      },
      {
        id: '6',
        name: '备用金申请',
        description: '处理备用金的申请流程',
        type: 'finance',
        status: 'completed',
        creator: '孙八',
        createTime: new Date('2024-01-03'),
        runCount: 12,
        duration: 90,
        category: 'finance',
        group: '资金管理'
      },
      // 出勤流程
      {
        id: '7',
        name: '请假',
        description: '处理员工请假申请',
        type: 'attendance',
        status: 'running',
        creator: '张三',
        createTime: new Date('2024-01-15'),
        runCount: 45,
        duration: 30,
        category: 'attendance',
        group: '请假管理'
      },
      {
        id: '8',
        name: '加班',
        description: '处理员工加班申请',
        type: 'attendance',
        status: 'completed',
        creator: '李四',
        createTime: new Date('2024-01-10'),
        runCount: 128,
        duration: 45,
        category: 'attendance',
        group: '加班管理'
      },
      {
        id: '9',
        name: '出差申请',
        description: '处理员工出差申请',
        type: 'attendance',
        status: 'running',
        creator: '王五',
        createTime: new Date('2024-01-12'),
        runCount: 67,
        duration: 120,
        category: 'attendance',
        group: '出差管理'
      },
      {
        id: '10',
        name: '外出',
        description: '处理员工外出申请',
        type: 'attendance',
        status: 'stopped',
        creator: '赵六',
        createTime: new Date('2024-01-08'),
        runCount: 89,
        duration: 60,
        category: 'attendance',
        group: '外出管理'
      },
      // 防疫专题流程
      {
        id: '11',
        name: '状态异常人员报备',
        description: '处理状态异常人员的报备流程',
        type: 'epidemic',
        status: 'error',
        creator: '钱七',
        createTime: new Date('2024-01-05'),
        runCount: 234,
        duration: 15,
        category: 'epidemic',
        group: '健康管理'
      },
      {
        id: '12',
        name: '每日健康报备',
        description: '处理每日健康报备流程',
        type: 'epidemic',
        status: 'completed',
        creator: '孙八',
        createTime: new Date('2024-01-03'),
        runCount: 12,
        duration: 90,
        category: 'epidemic',
        group: '健康管理'
      },
      {
        id: '13',
        name: '防疫物资申领',
        description: '处理防疫物资申领流程',
        type: 'epidemic',
        status: 'running',
        creator: '张三',
        createTime: new Date('2024-01-15'),
        runCount: 45,
        duration: 30,
        category: 'epidemic',
        group: '物资管理'
      },
      {
        id: '14',
        name: '居家办公申请',
        description: '处理居家办公申请流程',
        type: 'epidemic',
        status: 'completed',
        creator: '李四',
        createTime: new Date('2024-01-10'),
        runCount: 128,
        duration: 45,
        category: 'epidemic',
        group: '办公管理'
      },
      {
        id: '15',
        name: '出入办公场所申请',
        description: '处理出入办公场所申请流程',
        type: 'epidemic',
        status: 'running',
        creator: '王五',
        createTime: new Date('2024-01-12'),
        runCount: 67,
        duration: 120,
        category: 'epidemic',
        group: '场所管理'
      },
      // 人事流程
      {
        id: '16',
        name: '招聘需求',
        description: '处理招聘需求申请流程',
        type: 'hr',
        status: 'stopped',
        creator: '赵六',
        createTime: new Date('2024-01-08'),
        runCount: 89,
        duration: 60,
        category: 'hr',
        group: '招聘管理'
      },
      {
        id: '17',
        name: 'Offer 发放',
        description: '处理Offer发放流程',
        type: 'hr',
        status: 'error',
        creator: '钱七',
        createTime: new Date('2024-01-05'),
        runCount: 234,
        duration: 15,
        category: 'hr',
        group: '招聘管理'
      },
      {
        id: '18',
        name: 'Offer 薪酬申请',
        description: '处理Offer薪酬申请流程',
        type: 'hr',
        status: 'completed',
        creator: '孙八',
        createTime: new Date('2024-01-03'),
        runCount: 12,
        duration: 90,
        category: 'hr',
        group: '薪酬管理'
      }
    ];
  }

  /**
   * 更新流程分组缓存
   */
  private updateFlowGroupsCache(): void {
    // 缓存所有流程分组
    this.flowGroupsCache = this.groupFlows(this.flows);

    // 缓存每个分类的流程分组
    this.categories.forEach(category => {
      if (category.key) {
        const categoryFlows = this.flows.filter(f => f.category === category.key);
        this.categoryFlowGroupsCache.set(category.key, this.groupFlows(categoryFlows));
      }
    });
  }

  /**
   * 分类选择事件
   */
  onCategorySelect(categoryKey: string): void {
    this.selectedCategory = categoryKey;
  }

  /**
   * 获取指定分类的流程分组（使用缓存）
   */
  getFlowGroups(): FlowGroup[] {
    if (!this.selectedCategory) {
      return this.flowGroupsCache;
    }

    return this.categoryFlowGroupsCache.get(this.selectedCategory) || [];
  }

  /**
   * 获取所有流程分组（使用缓存）
   */
  getAllFlowGroups(): FlowGroup[] {
    return this.flowGroupsCache;
  }

  /**
   * 将流程按分组进行分组
   */
  private groupFlows(flows: Flow[]): FlowGroup[] {
    const groupMap = new Map<string, Flow[]>();

    flows.forEach(flow => {
      if (!groupMap.has(flow.group)) {
        groupMap.set(flow.group, []);
      }
      groupMap.get(flow.group)!.push(flow);
    });

    return Array.from(groupMap.entries()).map(([title, flows]) => ({
      title,
      flows
    }));
  }

  /**
   * 流程点击事件
   */
  onFlowClick(flow: Flow): void {
    console.log('点击流程:', flow);
    // 这里可以添加跳转到流程详情页的逻辑
  }

  /**
   * 获取流程图标
   */
  getFlowIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'finance': 'dollar',
      'attendance': 'clock-circle',
      'epidemic': 'safety-certificate',
      'hr': 'user',
      'admin': 'setting',
      'other': 'appstore'
    };
    return iconMap[type] || 'setting';
  }
}
