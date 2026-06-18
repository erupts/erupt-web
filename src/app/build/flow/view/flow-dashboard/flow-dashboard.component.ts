import {Component, OnDestroy, OnInit} from '@angular/core';
import {FlowApiService} from '@flow/service/flow-api.service';
import {FlowConfig, FlowGroup} from '@flow/model/flow.model';
import {R} from '@shared/model/api.model';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {CreateInstanceComponent} from "@flow/view/flow-dashboard/create-instance/create-instance.component";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {I18NService} from "@core";

interface Category {
    key: string;
    name: string;
}

interface FlowGroupWithFlows {
    title: string;
    flows: FlowConfig[];
}

@Component({
    standalone: false,
    selector: 'app-flow-dashboard',
    templateUrl: './flow-dashboard.component.html',
    styleUrls: ['./flow-dashboard.component.less']
})
export class FlowDashboardComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    // Category data - dynamically loaded from the API
    categories: Category[] = [];

    // Flow group data
    flowGroups: FlowGroup[] = [];

    // Flow configuration data
    flowConfigs: FlowConfig[] = [];

    // Selected category
    selectedCategory: string = '';

    // Search keyword
    searchKeyword: string = '';

    // Loading state
    loading = false;

    // Mobile sidebar state
    sidebarOpen = false;

    // Cached flow group data
    private flowGroupsCache: FlowGroupWithFlows[] = [];
    private categoryFlowGroupsCache: Map<string, FlowGroupWithFlows[]> = new Map();

    // Filtered flow groups (used for template display)
    filteredFlowGroups: FlowGroupWithFlows[] = [];

    constructor(private flowApiService: FlowApiService,
                private instanceApiService: FlowInstanceApiService,
                private drawerService: NzDrawerService,
                private i18n: I18NService) {
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
     * Load data
     */
    loadData(): void {
        this.loading = true;

        // Load flow groups and configuration data in parallel
        Promise.all([
            this.loadFlowGroups(),
            this.loadFlowConfigs()
        ]).finally(() => {
            this.loading = false;
            this.updateFlowGroupsCache();
        });
    }

    /**
     * Load flow group data
     */
    private loadFlowGroups(): Promise<void> {
        return new Promise((resolve) => {
            this.flowApiService.groupList()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response: R<FlowGroup[]>) => {
                        if (response.success && response.data) {
                            this.flowGroups = response.data;
                            // Dynamically generate categories based on group data
                            this.generateCategories();
                        }
                        resolve();
                    },
                    error: (error) => {
                        console.error('Failed to load flow groups:', error);
                        resolve();
                    }
                });
        });
    }

    /**
     * Load flow configuration data
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
                        console.error('Failed to load flow configurations:', error);
                        resolve();
                    }
                });
        });
    }

    /**
     * Dynamically generate categories from group data
     */
    private generateCategories(): void {
        // Keep the "All" category
        this.categories = [{key: '', name: this.i18n.fanyi('global.all')}];

        // Generate categories from flow groups
        this.flowGroups.forEach(group => {
            this.categories.push({
                key: group.name,
                name: group.name
            });
        });
    }

    /**
     * Update the flow group cache
     */
    private updateFlowGroupsCache(): void {
        // Cache all flow groups
        this.flowGroupsCache = this.groupFlows(this.flowConfigs);

        // Cache the flow groups for each category
        this.categories.forEach(category => {
            if (category.key) {
                const categoryFlows = this.flowConfigs.filter(config => config.flowGroup?.name === category.key);
                this.categoryFlowGroupsCache.set(category.key, this.groupFlows(categoryFlows));
            }
        });

        // Update the filtered flow groups
        this.updateFilteredFlowGroups();
    }

    /**
     * Category selection event
     */
    onCategorySelect(categoryKey: string): void {
        this.selectedCategory = categoryKey;
        this.updateFilteredFlowGroups();
        this.sidebarOpen = false;
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    /**
     * Update the filtered flow groups
     */
    private updateFilteredFlowGroups(): void {
        let groups: FlowGroupWithFlows[] = [];

        if (!this.selectedCategory) {
            groups = this.flowGroupsCache;
        } else {
            groups = this.categoryFlowGroupsCache.get(this.selectedCategory) || [];
        }

        // If a search keyword is present, filter results
        if (this.searchKeyword && this.searchKeyword.trim()) {
            const keyword = this.searchKeyword.trim().toLowerCase();
            this.filteredFlowGroups = groups
                .map(group => ({
                    title: group.title,
                    flows: group.flows.filter(flow =>
                        flow.name.toLowerCase().includes(keyword) ||
                        (flow.remark && flow.remark.toLowerCase().includes(keyword))
                    )
                }))
                .filter(group => group.flows.length > 0);
        } else {
            this.filteredFlowGroups = groups;
        }
    }

    /**
     * Group flows by their flow group
     */
    private groupFlows(flows: FlowConfig[]): FlowGroupWithFlows[] {
        const groupMap = new Map<string, FlowConfig[]>();

        flows.forEach(flow => {
            const groupName = flow.flowGroup?.name || this.i18n.fanyi('flow.dashboard.others');
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
     * Launch a flow
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
     * Get the flow count for a category
     */
    getCategoryFlowCount(categoryKey: string): number {
        if (!categoryKey) {
            return this.flowConfigs.length;
        }
        return this.flowConfigs.filter(config => config.flowGroup?.name === categoryKey).length;
    }

    /**
     * Refresh data
     */
    refreshData(): void {
        this.loadData();
    }

    /**
     * Search keyword change event
     */
    onSearchChange(): void {
        this.updateFilteredFlowGroups();
    }
}
