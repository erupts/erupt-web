import {Component, OnDestroy, OnInit} from '@angular/core';
import {FlowApiService} from '@flow/service/FlowApiService';
import {FlowConfig, FlowGroup} from '@flow/model/flow.model';
import {R} from '@shared/model/api.model';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

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

interface FlowGroupWithFlows {
  title: string;
  flows: Flow[];
}

@Component({
  selector: 'app-flow-dashboard',
  templateUrl: './flow-dashboard.component.html',
  styleUrls: ['./flow-dashboard.component.less']
})
export class FlowDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // 分类数据 - 从API动态获取
  categories: Category[] = [
    { key: '', name: '全部' }
  ];

  // 流程分组数据
  flowGroups: FlowGroup[] = [];
  
  // 流程配置数据
  flowConfigs: FlowConfig[] = [];

  // 选中的分类
  selectedCategory: string = '';

  // 加载状态
  loading = false;

  // 缓存的流程分组数据
  private flowGroupsCache: FlowGroupWithFlows[] = [];
  private categoryFlowGroupsCache: Map<string, FlowGroupWithFlows[]> = new Map();

  constructor(private flowApiService: FlowApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.flowGroupsCache = [];
    this.categoryFlowGroupsCache.clear();
  }

  /**
   * 加载数据
   */
  loadData(): void {
    this.loading = true;
    
    // 并行加载流程分组和配置数据
    Promise.all([
      this.loadFlowGroups(),
      this.loadFlowConfigs()
    ]).finally(() => {
      this.loading = false;
      this.updateFlowGroupsCache();
    });
  }

  /**
   * 加载流程分组数据
   */
  private loadFlowGroups(): Promise<void> {
    return new Promise((resolve) => {
      this.flowApiService.groupList()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: R<FlowGroup[]>) => {
            if (response.success && response.data) {
              this.flowGroups = response.data;
              // 根据分组数据动态生成分类
              this.generateCategories();
            }
            resolve();
          },
          error: (error) => {
            console.error('加载流程分组失败:', error);
            resolve();
          }
        });
    });
  }

  /**
   * 加载流程配置数据
   */
  private loadFlowConfigs(): Promise<void> {
    return new Promise((resolve) => {
      this.flowApiService.configList()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: R<FlowConfig[]>) => {
            if (response.success && response.data) {
              this.flowConfigs = response.data;
            }
            resolve();
          },
          error: (error) => {
            console.error('加载流程配置失败:', error);
            resolve();
          }
        });
    });
  }

  /**
   * 根据分组数据动态生成分类
   */
  private generateCategories(): void {
    // 保留"全部"分类
    this.categories = [{ key: '', name: '全部' }];
    
    // 根据流程分组生成分类
    this.flowGroups.forEach(group => {
      this.categories.push({
        key: group.name,
        name: group.name
      });
    });
  }

  /**
   * 更新流程分组缓存
   */
  private updateFlowGroupsCache(): void {
    // 将FlowConfig转换为Flow格式
    const flows: Flow[] = this.flowConfigs.map(config => ({
      id: config.id.toString(),
      name: config.name,
      description: config.remark || '',
      type: this.getFlowTypeByGroup(config.flowGroup?.name || ''),
      status: config.enable ? 'running' : 'stopped',
      creator: '系统',
      createTime: new Date(),
      runCount: Math.floor(Math.random() * 100) + 1, // 模拟数据
      duration: Math.floor(Math.random() * 120) + 15, // 模拟数据
      category: config.flowGroup?.name || '其他',
      group: config.flowGroup?.name || '其他'
    }));

    // 缓存所有流程分组
    this.flowGroupsCache = this.groupFlows(flows);

    // 缓存每个分类的流程分组
    this.categories.forEach(category => {
      if (category.key) {
        const categoryFlows = flows.filter(f => f.category === category.key);
        this.categoryFlowGroupsCache.set(category.key, this.groupFlows(categoryFlows));
      }
    });
  }

  /**
   * 根据分组名称获取流程类型
   */
  private getFlowTypeByGroup(groupName: string): string {
    const typeMap: { [key: string]: string } = {
      '财务': 'finance',
      '出勤': 'attendance',
      '防疫': 'epidemic',
      '人事': 'hr',
      '行政': 'admin'
    };
    
    for (const [key, value] of Object.entries(typeMap)) {
      if (groupName.includes(key)) {
        return value;
      }
    }
    return 'other';
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
  getFlowGroups(): FlowGroupWithFlows[] {
    if (!this.selectedCategory) {
      return this.flowGroupsCache;
    }

    return this.categoryFlowGroupsCache.get(this.selectedCategory) || [];
  }

  /**
   * 获取所有流程分组（使用缓存）
   */
  getAllFlowGroups(): FlowGroupWithFlows[] {
    return this.flowGroupsCache;
  }

  /**
   * 将流程按分组进行分组
   */
  private groupFlows(flows: Flow[]): FlowGroupWithFlows[] {
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

  /**
   * 获取分类流程数量
   */
  getCategoryFlowCount(categoryKey: string): number {
    if (!categoryKey) {
      return this.flowConfigs.length;
    }
    return this.flowConfigs.filter(config => config.flowGroup?.name === categoryKey).length;
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'running': 'green',
      'completed': 'blue',
      'stopped': 'orange',
      'error': 'red'
    };
    return colorMap[status] || 'default';
  }

  /**
   * 获取状态文本
   */
  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'running': '运行中',
      'completed': '已完成',
      'stopped': '已停止',
      'error': '异常'
    };
    return textMap[status] || '未知';
  }

  /**
   * 刷新数据
   */
  refreshData(): void {
    this.loadData();
  }
}
