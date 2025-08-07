import {Component, Inject, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {FlowApiService} from '@flow/service/FlowApiService';
import {FlowConfig, FlowGroup} from '@flow/model/flow.model';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {R} from '@shared/model/api.model';
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {FlowConfigComponent} from "@flow/view/flow-management/flow-config/flow-config.component";

// 扩展 FlowGroup 接口，添加 count 属性
interface FlowGroupWithCount extends FlowGroup {
    count: number;
}

@Component({
    selector: 'erupt-flow-management',
    templateUrl: './flow-management.component.html',
    styleUrls: ['./flow-management.component.less']
})
export class FlowManagementComponent implements OnInit {

    searchValue = '';
    flowConfigs: FlowConfig[] = []; // 流程配置列表
    categories: string[] = [];
    selectedCategory: string = '';

    // 排序相关
    categoryItems: FlowGroupWithCount[] = [];

    // 加载状态
    loading = false;
    configLoading = false; // 流程配置加载状态

    // 模态框相关属性
    isCreateModalVisible = false;
    isEditModalVisible = false;
    createGroupName = '';
    editGroupName = '';
    editingGroup: FlowGroupWithCount | null = null;

    constructor(
        private flowApiService: FlowApiService,
        private message: NzMessageService,
        private modal: NzModalService,
        @Inject(NzDrawerService) private drawerService: NzDrawerService,
    ) {
    }

    ngOnInit(): void {
        this.loadGroups();
        this.loadFlowConfigs();
    }

    // 加载分组数据
    loadGroups(): void {
        this.loading = true;
        this.flowApiService.groupList().subscribe(response => {
            this.categoryItems = response.data.map((group, index) => ({
                id: group.id,
                name: group.name,
                sort: group.sort || index,
                count: this.getConfigsByCategory(group.name).length
            }));

            // 按sort排序
            this.categoryItems.sort((a, b) => a.sort - b.sort);

            // 更新categories数组
            this.categories = this.categoryItems.map(item => item.name);
            this.loading = false;
        });
    }

    // 加载流程配置数据
    loadFlowConfigs(): void {
        this.configLoading = true;
        this.flowApiService.configList().subscribe({
            next: (response: R<FlowConfig[]>) => {
                if (response.success) {
                    this.flowConfigs = response.data;
                    // 更新分组计数
                    this.updateCategoryCounts();
                }
                this.configLoading = false;
            },
            error: (error) => {
                this.configLoading = false;
            }
        });
    }

    // 更新分组计数 - 基于流程配置数据
    updateCategoryCounts(): void {
        this.categoryItems.forEach(item => {
            item.count = this.getConfigsByCategory(item.name).length;
        });
    }

    // 根据分组获取流程配置
    getConfigsByCategory(category: string): FlowConfig[] {
        return this.flowConfigs.filter(config => config.flowGroup?.name === category);
    }

    selectCategory(category: string): void {
        this.selectedCategory = category;
    }

    // 获取当前显示的流程配置列表
    getCurrentConfigs(): FlowConfig[] {
        let configs = this.flowConfigs;

        // 按分类筛选
        if (this.selectedCategory) {
            configs = this.getConfigsByCategory(this.selectedCategory);
        }

        // 按搜索关键词筛选
        if (this.searchValue.trim()) {
            const searchTerm = this.searchValue.toLowerCase().trim();
            configs = configs.filter(config =>
                config.name.toLowerCase().includes(searchTerm) ||
                (config.remark && config.remark.toLowerCase().includes(searchTerm))
            );
        }

        return configs;
    }

    onSearch(): void {
        // 搜索功能已集成到 getCurrentConfigs 方法中
        console.log('搜索:', this.searchValue);
    }

    // 创建分组
    onCreateGroup(): void {
        this.createGroupName = '';
        this.isCreateModalVisible = true;
    }

    // 确认创建分组
    handleCreateGroup(): void {
        if (this.createGroupName && this.createGroupName.trim()) {
            this.addGroup(this.createGroupName.trim());
        } else {
            this.message.warning('请输入分组名称');
        }
    }

    // 取消创建分组
    handleCreateCancel(): void {
        this.isCreateModalVisible = false;
        this.createGroupName = '';
    }

    // 添加分组
    addGroup(name: string): void {
        this.flowApiService.groupAdd(name).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    this.message.success('分组创建成功');
                    this.isCreateModalVisible = false;
                    this.createGroupName = '';
                    this.loadGroups(); // 重新加载分组列表
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

    // 编辑分组
    onEditGroup(item: FlowGroupWithCount): void {
        this.editingGroup = item;
        this.editGroupName = item.name;
        this.isEditModalVisible = true;
    }

    // 确认编辑分组
    handleEditGroup(): void {
        if (this.editGroupName && this.editGroupName.trim() && this.editingGroup?.id) {
            this.editGroup(this.editingGroup.id, this.editGroupName.trim());
        } else {
            this.message.warning('请输入分组名称');
        }
    }

    // 取消编辑分组
    handleEditCancel(): void {
        this.isEditModalVisible = false;
        this.editGroupName = '';
        this.editingGroup = null;
    }

    // 编辑分组
    editGroup(id: number, name: string): void {
        this.flowApiService.groupEdit(id, name).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    this.message.success('分组编辑成功');
                    this.isEditModalVisible = false;
                    this.editGroupName = '';
                    this.editingGroup = null;
                    this.loadGroups(); // 重新加载分组列表
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

    // 删除分组
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
                        if (response.success) {
                            this.message.success('分组删除成功');
                            this.loadGroups(); // 重新加载分组列表
                        } else {
                            this.message.error(response.message || '删除分组失败');
                        }
                    },
                    error: (error) => {
                        console.error('删除分组失败:', error);
                        this.message.error('删除分组失败');
                    }
                });
            }
        });
    }

    // 拖拽排序
    onDrop(event: CdkDragDrop<FlowGroupWithCount[]>): void {
        moveItemInArray(this.categoryItems, event.previousIndex, event.currentIndex);

        // 更新sort
        this.categoryItems.forEach((item, index) => {
            item.sort = index;
        });

        // 更新categories数组
        this.categories = this.categoryItems.map(item => item.name);

        // 调用排序API
        this.sortGroups();
    }

    // 排序分组
    sortGroups(): void {
        const ids = this.categoryItems.map(item => item.id).filter(id => id !== undefined) as number[];
        if (ids.length === 0) return;

        this.flowApiService.groupSort(ids).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    console.log('分组排序成功');
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

    onCreateApproval(id?: number): void {
        const drawerRef = this.drawerService.create({
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

        // 使用轮询方式等待组件实例可用
        const checkComponent = () => {
            const componentInstance = drawerRef.getContentComponent();
            if (componentInstance) {
                componentInstance.closeConfig.subscribe(() => {
                    drawerRef.close();
                    this.loadFlowConfigs();
                });
            } else {
                // 如果组件实例还未可用，继续等待
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
                            this.loadFlowConfigs(); // 重新加载流程配置列表
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

        // 保存原始状态，用于失败时恢复
        const originalEnable = config.enable;
        const targetEnable = !config.enable;

        this.flowApiService.configSwitchEnable(config.id).subscribe({
            next: (response: R<void>) => {
                if (response.success) {
                    // 更新本地状态
                    config.enable = targetEnable;
                    const action = targetEnable ? '启用' : '停用';
                    this.message.success(`${config.name}${action}成功`);
                } else {
                    // 恢复原始状态
                    config.enable = originalEnable;
                    this.message.error(response.message || `${targetEnable ? '启用' : '停用'}流程配置失败`);
                }
            },
            error: (error) => {
                // 恢复原始状态
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
                            this.loadFlowConfigs(); // 重新加载流程配置列表
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
