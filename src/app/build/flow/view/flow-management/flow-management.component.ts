import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {FlowApiService} from '@flow/service/flow-api.service';
import {FlowConfig, FlowGroup} from '@flow/model/flow.model';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {R} from '@shared/model/api.model';
import {NzDrawerRef, NzDrawerService} from "ng-zorro-antd/drawer";
import {FlowConfigComponent} from "@flow/view/flow-management/flow-config/flow-config.component";
import {FlowDataService} from "@flow/service/flow-data.service";

// Extend the FlowGroup interface to add a count property
interface FlowGroupWithCount extends FlowGroup {
    count: number;
}

@Component({
    standalone: false,
    selector: 'erupt-flow-management',
    templateUrl: './flow-management.component.html',
    styleUrls: ['./flow-management.component.less']
})
export class FlowManagementComponent implements OnInit, OnDestroy {

    searchValue = '';
    flowConfigs: FlowConfig[] = []; // Flow configuration list
    categories: string[] = [];
    selectedCategory: number = null;

    // Sorting-related
    categoryItems: FlowGroupWithCount[] = [];

    // Loading states
    loading = false;

    // Mobile sidebar state
    sidebarOpen = false;
    configLoading = false; // Flow config loading state

    // Modal-related properties
    isCreateModalVisible = false;
    isEditModalVisible = false;
    createGroupName = '';
    editGroupName = '';
    editingGroup: FlowGroupWithCount | null = null;

    configDrawerRef: NzDrawerRef;

    constructor(
        private flowApiService: FlowApiService,
        private message: NzMessageService,
        private modal: NzModalService,
        private flowDataService: FlowDataService,
        @Inject(NzDrawerService) private drawerService: NzDrawerService,
    ) {
    }

    ngOnDestroy(): void {
        if (this.configDrawerRef) {
            this.configDrawerRef.close();
        }
    }

    ngOnInit(): void {
        this.loadGroups();
        this.loadFlowConfigs();
    }

    // Load group data
    loadGroups(): void {
        this.loading = true;
        this.flowApiService.groupList().subscribe(response => {
            this.categoryItems = response.data.map((group, index) => ({
                id: group.id,
                name: group.name,
                sort: group.sort || index,
                count: this.getConfigsByCategory(group.id).length
            }));

            // Sort by sort field
            this.categoryItems.sort((a, b) => a.sort - b.sort);

            // Update categories array
            this.categories = this.categoryItems.map(item => item.name);
            this.loading = false;
        });
    }

    // Load flow configuration data
    loadFlowConfigs(): void {
        this.configLoading = true;
        this.flowApiService.configList().subscribe({
            next: (response: R<FlowConfig[]>) => {
                if (response.success) {
                    this.flowConfigs = response.data;
                    // Update group counts
                    this.updateCategoryCounts();
                }
                this.configLoading = false;
            },
            error: (error) => {
                this.configLoading = false;
            }
        });
    }

    // Update group counts based on flow configuration data
    updateCategoryCounts(): void {
        this.categoryItems.forEach(item => {
            item.count = this.getConfigsByCategory(item.id).length;
        });
    }

    // Get flow configurations by group
    getConfigsByCategory(category: number): FlowConfig[] {
        return this.flowConfigs.filter(config => config.flowGroup?.id === category);
    }

    selectCategory(category: number): void {
        this.selectedCategory = category;
        this.sidebarOpen = false;
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    // Get the currently displayed flow configuration list
    getCurrentConfigs(): FlowConfig[] {
        let configs = this.flowConfigs;

        // Filter by category
        if (this.selectedCategory) {
            configs = this.getConfigsByCategory(this.selectedCategory);
        }

        // Filter by search keyword
        if (this.searchValue.trim()) {
            const searchTerm = this.searchValue.toLowerCase().trim();
            configs = configs.filter(config =>
                config.name.toLowerCase().includes(searchTerm) ||
                (config.remark && config.remark.toLowerCase().includes(searchTerm))
            );
        }

        return configs;
    }

    getEnabledCount(): number {
        return this.getCurrentConfigs().filter(c => c.enable).length;
    }

    onSearch(): void {
        // Search functionality is integrated into the getCurrentConfigs method
        console.log('Search:', this.searchValue);
    }

    // Create a group
    onCreateGroup(): void {
        this.createGroupName = '';
        this.isCreateModalVisible = true;
    }

    // Confirm group creation
    handleCreateGroup(): void {
        if (this.createGroupName && this.createGroupName.trim()) {
            this.addGroup(this.createGroupName.trim());
        } else {
            this.message.warning('请输入分组名称');
        }
    }

    // Cancel group creation
    handleCreateCancel(): void {
        this.isCreateModalVisible = false;
        this.createGroupName = '';
    }

    // Add a group
    addGroup(name: string): void {
        this.flowApiService.groupAdd(name).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    this.message.success('分组创建成功');
                    this.isCreateModalVisible = false;
                    this.createGroupName = '';
                    this.loadGroups(); // Reload the group list
                } else {
                    this.message.error(response.message || '创建分组失败');
                }
            },
            error: (error) => {
                console.error('创建分组失败:', error);
                this.message.error('创建分组失败');
            }
        });
    }

    // Edit a group
    onEditGroup(item: FlowGroupWithCount): void {
        this.editingGroup = item;
        this.editGroupName = item.name;
        this.isEditModalVisible = true;
    }

    // Confirm group edit
    handleEditGroup(): void {
        if (this.editGroupName && this.editGroupName.trim() && this.editingGroup?.id) {
            this.editGroup(this.editingGroup.id, this.editGroupName.trim());
        } else {
            this.message.warning('请输入分组名称');
        }
    }

    // Cancel group edit
    handleEditCancel(): void {
        this.isEditModalVisible = false;
        this.editGroupName = '';
        this.editingGroup = null;
    }

    // Edit a group
    editGroup(id: number, name: string): void {
        this.flowApiService.groupEdit(id, name).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    this.message.success('分组编辑成功');
                    this.isEditModalVisible = false;
                    this.editGroupName = '';
                    this.editingGroup = null;
                    this.loadGroups(); // Reload the group list
                } else {
                    this.message.error(response.message || '编辑分组失败');
                }
            },
            error: (error) => {
                console.error('编辑分组失败:', error);
                this.message.error('编辑分组失败');
            }
        });
    }

    // Delete a group
    onDeleteGroup(item: FlowGroupWithCount): void {
        if (!item.id) return;

        this.modal.confirm({
            nzTitle: '确认删除',
            nzContent: `确定要删除分组"${item.name}"吗？`,
            nzOkText: '确定',
            nzCancelText: '取消',
            nzOnOk: () => {
                this.flowApiService.groupDelete(item.id).subscribe({
                    next: (response: R<void>) => {
                        this.message.success('分组删除成功');
                        this.loadGroups();
                    }
                });
            }
        });
    }

    // Drag-and-drop sorting
    onDrop(event: CdkDragDrop<FlowGroupWithCount[]>): void {
        moveItemInArray(this.categoryItems, event.previousIndex, event.currentIndex);

        // Update sort values
        this.categoryItems.forEach((item, index) => {
            item.sort = index;
        });

        // Update categories array
        this.categories = this.categoryItems.map(item => item.name);

        // Call the sort API
        this.sortGroups();
    }

    // Sort groups
    sortGroups(): void {
        const ids = this.categoryItems.map(item => item.id).filter(id => id !== undefined) as number[];
        if (ids.length === 0) return;

        this.flowApiService.groupSort(ids).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    console.log('Group sort successful');
                } else {
                    this.message.error(response.message || '分组排序失败');
                }
            },
            error: (error) => {
                console.error('分组排序失败:', error);
                this.message.error('分组排序失败');
            }
        });
    }

    // Flow drag-and-drop sorting
    onFlowDrop(event: CdkDragDrop<FlowConfig[]>): void {
        // Only allow sorting when a group is selected
        if (this.selectedCategory === null) {
            this.message.warning('请先选择分组后再进行排序');
            return;
        }

        // Get all flow configs in the current group (for validation)
        const currentConfigs = this.getConfigsByCategory(this.selectedCategory);

        // If the displayed config count differs from the group config count (possibly filtered by search), disallow sorting
        const displayedConfigs = this.getCurrentConfigs();
        if (currentConfigs.length !== displayedConfigs.length) {
            this.message.warning('搜索状态下无法排序，请先清除搜索条件');
            return;
        }

        // Find the index range of the current group's configs in the original array
        const groupConfigIndices: number[] = [];
        this.flowConfigs.forEach((config, index) => {
            if (config.flowGroup?.id === this.selectedCategory) {
                groupConfigIndices.push(index);
            }
        });

        // If index count does not match, reload data
        if (groupConfigIndices.length !== currentConfigs.length) {
            this.loadFlowConfigs();
            return;
        }

        // Calculate the actual indices in the original array
        const fromIndex = groupConfigIndices[event.previousIndex];
        const toIndex = groupConfigIndices[event.currentIndex];

        // Update the order in the original array
        moveItemInArray(this.flowConfigs, fromIndex, toIndex);

        // Call the sort API
        this.sortFlows();
    }

    // Sort flows
    sortFlows(): void {
        if (!this.selectedCategory) {
            return;
        }

        // Get all flow configs in the current group (in the new order)
        const currentConfigs = this.getConfigsByCategory(this.selectedCategory);
        const ids = currentConfigs.map(config => config.id).filter(id => id !== undefined) as number[];

        if (ids.length === 0) {
            return;
        }

        this.flowApiService.flowSort(ids, this.selectedCategory).subscribe({
            next: (response: R<void>) => {
                if (!response.success) {
                    this.loadFlowConfigs();
                    this.message.error(response.message || 'Sort Error');
                }
            },
            error: (error) => {
                this.loadFlowConfigs();
                this.message.error('Sort Error');
            }
        });
    }

    onCreateApproval(id?: number): void {
        this.configDrawerRef = this.drawerService.create({
            nzTitle: null,
            nzWidth: "100%",
            nzClosable: false,
            nzMaskClosable: false,
            nzContent: FlowConfigComponent,
            nzContentParams: {
                flowId: id
            },
            nzBodyStyle: {
                padding: '0px'
            }
        });
        // Poll until the component instance is available
        const checkComponent = () => {
            const componentInstance = this.configDrawerRef.getContentComponent();
            if (componentInstance) {
                componentInstance.closeConfig.subscribe(() => {
                    this.configDrawerRef.close();
                    this.loadFlowConfigs();
                });
            } else {
                // If the component instance is not yet available, keep waiting
                setTimeout(checkComponent, 50);
            }
        };
        checkComponent();
    }

    onEdit(config: FlowConfig): void {
        this.onCreateApproval(config.id)
    }

    onDuplicate(config: FlowConfig): void {
        if (!config.id) {
            this.message.warning('配置ID不存在');
            return;
        }

        this.modal.confirm({
            nzTitle: '确认复制',
            nzContent: `确定要复制流程配置"${config.name}"吗？`,
            nzOkText: '确定',
            nzCancelText: '取消',
            nzOnOk: () => {
                this.flowApiService.configCopy(config.id).subscribe({
                    next: (response: R<void>) => {
                        if (response.success) {
                            this.message.success('流程配置复制成功');
                            this.loadFlowConfigs(); // Reload the flow configuration list
                        } else {
                            this.message.error(response.message || '复制流程配置失败');
                        }
                    },
                    error: (error) => {
                        console.error('复制流程配置失败:', error);
                        this.message.error('复制流程配置失败');
                    }
                });
            }
        });
    }

    onToggleVisibility(config: FlowConfig): void {
        if (!config.id) {
            this.message.warning('配置ID不存在');
            return;
        }

        // Save the original state for rollback on failure
        const originalEnable = config.enable;
        const targetEnable = !config.enable;

        this.flowApiService.configSwitchEnable(config.id).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    // Update local state
                    config.enable = targetEnable;
                    const action = targetEnable ? '启用' : '停用';
                    this.message.success(`${config.name}${action}成功`);
                } else {
                    // Restore original state
                    config.enable = originalEnable;
                    this.message.error(response.message || `${targetEnable ? '启用' : '停用'}流程配置失败`);
                }
            },
            error: (error) => {
                // Restore original state
                config.enable = originalEnable;
                console.error('切换流程配置状态失败:', error);
                this.message.error('切换流程配置状态失败');
            }
        });
    }

    onDelete(config: FlowConfig): void {
        if (!config.id) {
            this.message.warning('配置ID不存在');
            return;
        }

        this.modal.confirm({
            nzTitle: '确认删除',
            nzContent: `确定要删除流程配置"${config.name}"吗？此操作不可恢复。`,
            nzOkText: '确定',
            nzCancelText: '取消',
            nzOkDanger: true,
            nzOnOk: () => {
                this.flowApiService.configDelete(config.id).subscribe({
                    next: (response: R<void>) => {
                        if (response.success) {
                            this.message.success('流程配置删除成功');
                            this.loadFlowConfigs(); // Reload the flow configuration list
                        } else {
                            this.message.error(response.message || '删除流程配置失败');
                        }
                    },
                    error: (error) => {
                        console.error('删除流程配置失败:', error);
                        this.message.error('删除流程配置失败');
                    }
                });
            }
        });
    }

}
