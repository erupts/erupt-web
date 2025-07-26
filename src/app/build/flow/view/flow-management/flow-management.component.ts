import {Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {FlowApiService} from '@flow/service/FlowApiService';
import {FlowGroup} from '@flow/model/flow.model';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {R} from '@shared/model/api.model';

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
    flowApps: FlowApp[] = [];
    categories: string[] = [];
    selectedCategory: string = '';

    // 排序相关
    categoryItems: FlowGroupWithCount[] = [];

    // 加载状态
    loading = false;

    // 模态框相关属性
    isCreateModalVisible = false;
    isEditModalVisible = false;
    createGroupName = '';
    editGroupName = '';
    editingGroup: FlowGroupWithCount | null = null;

    constructor(
        private flowApiService: FlowApiService,
        private message: NzMessageService,
        private modal: NzModalService
    ) {
    }

    ngOnInit(): void {
        this.loadGroups();
        this.initData();
    }

    // 加载分组数据
    loadGroups(): void {
        this.loading = true;
        this.flowApiService.groupList().subscribe(response => {
            this.categoryItems = response.data.map((group, index) => ({
                id: group.id,
                name: group.name,
                sort: group.sort || index,
                count: this.getAppsByCategory(group.name).length
            }));

            // 按sort排序
            this.categoryItems.sort((a, b) => a.sort - b.sort);

            // 更新categories数组
            this.categories = this.categoryItems.map(item => item.name);
            this.loading = false;
        });
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

        // 更新分组计数
        this.updateCategoryCounts();
    }

    // 更新分组计数
    updateCategoryCounts(): void {
        this.categoryItems.forEach(item => {
            item.count = this.getAppsByCategory(item.name).length;
        });
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
