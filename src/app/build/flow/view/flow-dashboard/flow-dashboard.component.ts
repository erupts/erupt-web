import {Component, OnDestroy, OnInit} from '@angular/core';
import {FlowApiService} from '@flow/service/flow-api.service';
import {FlowConfig, FlowGroup} from '@flow/model/flow.model';
import {R} from '@shared/model/api.model';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {CreateInstanceComponent} from "@flow/view/flow-dashboard/create-instance/create-instance.component";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";

interface Category {
    key: string;
    name: string;
}

interface FlowGroupWithFlows {
    title: string;
    flows: FlowConfig[];
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
        {key: '', name: '全部'}
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

    constructor(private flowApiService: FlowApiService,
                private instanceApiService: FlowInstanceApiService,
                private drawerService: NzDrawerService) {
    }

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
            this.instanceApiService.userFlows()
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
        this.categories = [{key: '', name: '全部'}];

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
        // 缓存所有流程分组
        this.flowGroupsCache = this.groupFlows(this.flowConfigs);

        // 缓存每个分类的流程分组
        this.categories.forEach(category => {
            if (category.key) {
                const categoryFlows = this.flowConfigs.filter(config => config.flowGroup?.name === category.key);
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
    private groupFlows(flows: FlowConfig[]): FlowGroupWithFlows[] {
        const groupMap = new Map<string, FlowConfig[]>();

        flows.forEach(flow => {
            const groupName = flow.flowGroup?.name || '其他';
            if (!groupMap.has(groupName)) {
                groupMap.set(groupName, []);
            }
            groupMap.get(groupName)!.push(flow);
        });

        return Array.from(groupMap.entries()).map(([title, flows]) => ({
            title,
            flows
        }));
    }

    /**
     * 发起流程
     */
    launchFlow(flow: FlowConfig): void {
        if (flow.enable) {
            const drawer = this.drawerService.create({
                nzTitle: flow.name,
                nzContent: CreateInstanceComponent,
                nzContentParams: {
                    erupt: flow.erupt,
                    flow: flow,
                    onClose: () => drawer.close()
                },
                nzWidth: '520px',
                nzBodyStyle: {
                    padding: '0'
                },
                nzMaskClosable: false
            });
        }
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
     * 刷新数据
     */
    refreshData(): void {
        this.loadData();
    }
}
