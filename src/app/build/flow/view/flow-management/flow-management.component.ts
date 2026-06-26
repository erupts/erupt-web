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
import {I18NService} from "@core";

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
        private i18n: I18NService,
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
            this.message.warning(this.i18n.fanyi('flow.placeholder.group_name'));
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
                    this.message.success(this.i18n.fanyi('flow.success.group_created'));
                    this.isCreateModalVisible = false;
                    this.createGroupName = '';
                    this.loadGroups(); // Reload the group list
                } else {
                    this.message.error(response.message || this.i18n.fanyi('flow.error.group_create_failed'));
                }
            },
            error: (error) => {
                console.error('创建分组失败:', error);
                this.message.error(this.i18n.fanyi('flow.error.group_create_failed'));
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
            this.message.warning(this.i18n.fanyi('flow.placeholder.group_name'));
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
                    this.message.success(this.i18n.fanyi('flow.success.group_edited'));
                    this.isEditModalVisible = false;
                    this.editGroupName = '';
                    this.editingGroup = null;
                    this.loadGroups(); // Reload the group list
                } else {
                    this.message.error(response.message || this.i18n.fanyi('flow.error.group_edit_failed'));
                }
            },
            error: (error) => {
                console.error('编辑分组失败:', error);
                this.message.error(this.i18n.fanyi('flow.error.group_edit_failed'));
            }
        });
    }

    // Delete a group
    onDeleteGroup(item: FlowGroupWithCount): void {
        if (!item.id) return;

        this.modal.confirm({
            nzTitle: this.i18n.fanyi('flow.modal.confirm_delete'),
            nzContent: `${this.i18n.fanyi('flow.management.confirm_delete_group_prefix')}${item.name}${this.i18n.fanyi('flow.management.confirm_delete_group_suffix')}`,
            nzOkText: this.i18n.fanyi('global.ok'),
            nzCancelText: this.i18n.fanyi('global.cancel'),
            nzOnOk: () => {
                this.flowApiService.groupDelete(item.id).subscribe({
                    next: (response: R<void>) => {
                        this.message.success(this.i18n.fanyi('flow.success.group_deleted'));
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
                    this.message.error(response.message || this.i18n.fanyi('flow.error.group_sort_failed'));
                }
            },
            error: (error) => {
                console.error('分组排序失败:', error);
                this.message.error(this.i18n.fanyi('flow.error.group_sort_failed'));
            }
        });
    }

    // Flow drag-and-drop sorting
    onFlowDrop(event: CdkDragDrop<FlowConfig[]>): void {
        // Only allow sorting when a group is selected
        if (this.selectedCategory === null) {
            this.message.warning(this.i18n.fanyi('flow.warning.select_category_for_sort'));
            return;
        }

        // Get all flow configs in the current group (for validation)
        const currentConfigs = this.getConfigsByCategory(this.selectedCategory);

        // If the displayed config count differs from the group config count (possibly filtered by search), disallow sorting
        const displayedConfigs = this.getCurrentConfigs();
        if (currentConfigs.length !== displayedConfigs.length) {
            this.message.warning(this.i18n.fanyi('flow.warning.search_sort_disabled'));
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
            this.message.warning(this.i18n.fanyi('flow.error.config_id_not_found'));
            return;
        }

        this.modal.confirm({
            nzTitle: this.i18n.fanyi('flow.modal.confirm_copy'),
            nzContent: `${this.i18n.fanyi('flow.config.confirm_copy_prefix')}${config.name}${this.i18n.fanyi('flow.config.confirm_copy_suffix')}`,
            nzOkText: this.i18n.fanyi('global.ok'),
            nzCancelText: this.i18n.fanyi('global.cancel'),
            nzOnOk: () => {
                this.flowApiService.configCopy(config.id).subscribe({
                    next: (response: R<void>) => {
                        if (response.success) {
                            this.message.success(this.i18n.fanyi('flow.success.config_copied'));
                            this.loadFlowConfigs(); // Reload the flow configuration list
                        } else {
                            this.message.error(response.message || this.i18n.fanyi('flow.error.config_copy_failed'));
                        }
                    },
                    error: (error) => {
                        console.error('复制流程配置失败:', error);
                        this.message.error(this.i18n.fanyi('flow.error.config_copy_failed'));
                    }
                });
            }
        });
    }

    onToggleVisibility(config: FlowConfig): void {
        if (!config.id) {
            this.message.warning(this.i18n.fanyi('flow.error.config_id_not_found'));
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
                    const action = targetEnable ? this.i18n.fanyi('flow.management.enable') : this.i18n.fanyi('flow.management.disable');
                    this.message.success(config.name + (targetEnable ? this.i18n.fanyi('flow.success.config_enabled_suffix') : this.i18n.fanyi('flow.success.config_disabled_suffix')));
                } else {
                    // Restore original state
                    config.enable = originalEnable;
                    this.message.error(response.message || this.i18n.fanyi('flow.error.config_toggle_failed'));
                }
            },
            error: (error) => {
                // Restore original state
                config.enable = originalEnable;
                console.error('切换流程配置状态失败:', error);
                this.message.error(this.i18n.fanyi('flow.error.config_toggle_failed'));
            }
        });
    }

    onDelete(config: FlowConfig): void {
        if (!config.id) {
            this.message.warning(this.i18n.fanyi('flow.error.config_id_not_found'));
            return;
        }

        this.modal.confirm({
            nzTitle: this.i18n.fanyi('flow.modal.confirm_delete'),
            nzContent: `${this.i18n.fanyi('flow.config.confirm_delete_prefix')}${config.name}${this.i18n.fanyi('flow.config.confirm_delete_suffix')}`,
            nzOkText: this.i18n.fanyi('global.ok'),
            nzCancelText: this.i18n.fanyi('global.cancel'),
            nzOkDanger: true,
            nzOnOk: () => {
                this.flowApiService.configDelete(config.id).subscribe({
                    next: (response: R<void>) => {
                        if (response.success) {
                            this.message.success(this.i18n.fanyi('flow.success.config_deleted'));
                            this.loadFlowConfigs(); // Reload the flow configuration list
                        } else {
                            this.message.error(response.message || this.i18n.fanyi('flow.error.config_delete_failed'));
                        }
                    },
                    error: (error) => {
                        console.error('删除流程配置失败:', error);
                        this.message.error(this.i18n.fanyi('flow.error.config_delete_failed'));
                    }
                });
            }
        });
    }

}
