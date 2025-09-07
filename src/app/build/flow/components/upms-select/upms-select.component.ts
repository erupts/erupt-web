import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {KV} from "../../../erupt/model/util.model";
import {FlowUpmsScope, UpmsScope} from "@flow/model/flow.model";
import {UpmsDataService} from "@flow/service/upms-data.service";

interface TabData {
    key: UpmsScope;
    label: string;
    icon: string;
    items: KV<number, string>[];
    searchText: string;
}

// 扩展的FlowUpmsScope，包含显示信息
interface FlowUpmsScopeDisplay extends FlowUpmsScope {
    displayName: string;
    icon: string;
    label: string;
}

// 分组显示数据
interface GroupedDisplayData {
    scope: UpmsScope;
    label: string;
    icon: string;
    items: FlowUpmsScopeDisplay[];
}

@Component({
    selector: 'app-upms-select',
    templateUrl: './upms-select.component.html',
    styleUrls: ['./upms-select.component.less']
})
export class UpmsSelectComponent implements OnInit {

    @Input() flowUpmsScopes: FlowUpmsScope[] = [];
    @Output() flowUpmsScopesChange = new EventEmitter<FlowUpmsScope[]>();

    activeTab = 0;

    tabs: TabData[] = [
        {
            key: UpmsScope.USER,
            label: '用户',
            icon: 'user',
            items: [],
            searchText: ''
        },
        {
            key: UpmsScope.ROLE,
            label: '角色',
            icon: 'safety-certificate',
            items: [],
            searchText: ''
        },

        {
            key: UpmsScope.POST,
            label: '岗位',
            icon: 'idcard',
            items: [],
            searchText: ''
        }
    ];

    constructor(private upmsDataService: UpmsDataService) {

    }

    ngOnInit() {
        this.loadData();
    }

    private loadData() {
        // 加载用户数据
        this.tabs.find(tab => tab.key === UpmsScope.USER)!.items = this.upmsDataService.users;
        this.tabs.find(tab => tab.key === UpmsScope.POST)!.items = this.upmsDataService.posts;
        this.tabs.find(tab => tab.key === UpmsScope.ROLE)!.items = this.upmsDataService.roles;
    }


    onTabChange(tabIndex: number) {
        this.activeTab = tabIndex;
    }

    onSearchChange(tabKey: UpmsScope, searchText: string) {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (tab) {
            tab.searchText = searchText;
        }
    }

    onItemToggle(tabKey: UpmsScope, item: KV<number, string>) {
        // 检查项目是否已经在 flowUpmsScopes 中
        const isSelected = this.flowUpmsScopes.some(s =>
            s.scope === tabKey && s.scopeValue === item.key
        );

        if (!isSelected) {
            // 添加到 flowUpmsScopes
            const scopeItem: FlowUpmsScope = {
                scope: tabKey,
                scopeValue: item.key
            };
            this.flowUpmsScopes.push(scopeItem);
        } else {
            // 从 flowUpmsScopes 移除
            const scopeIndex = this.flowUpmsScopes.findIndex(s =>
                s.scope === tabKey && s.scopeValue === item.key
            );
            if (scopeIndex > -1) {
                this.flowUpmsScopes.splice(scopeIndex, 1);
            }
        }

        this.emitChanges();
    }

    onItemRemove(scope: FlowUpmsScope) {
        // 从 flowUpmsScopes 移除
        const scopeIndex = this.flowUpmsScopes.findIndex(s =>
            s.scope === scope.scope && s.scopeValue === scope.scopeValue
        );
        if (scopeIndex > -1) {
            this.flowUpmsScopes.splice(scopeIndex, 1);
        }


        this.emitChanges();
    }

    onClearAll(tabKey?: UpmsScope) {
        if (tabKey) {
            // 清空指定类型的项目
            this.flowUpmsScopes = this.flowUpmsScopes.filter(s => s.scope !== tabKey);
        } else {
            // 清空所有项目
            this.flowUpmsScopes = [];
        }

        this.emitChanges();
    }


    private emitChanges() {
        this.flowUpmsScopesChange.emit(this.flowUpmsScopes);
    }

    // 获取过滤后的项目列表
    getFilteredItems(tabKey: UpmsScope): KV<number, string>[] {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return [];

        if (!tab.searchText) {
            return tab.items;
        }
        return tab.items.filter(item =>
            item.value.toLowerCase().includes(tab.searchText.toLowerCase())
        );
    }

    // 获取当前标签页
    get currentTab(): TabData {
        return this.tabs[this.activeTab];
    }

    // 获取当前标签页的键
    get currentTabKey(): UpmsScope {
        return this.currentTab.key;
    }

    // 获取当前标签页的标签
    get currentTabLabel(): string {
        return this.currentTab.label;
    }

    // 获取列表标题
    getListTitle(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        const count = this.getFilteredItems(tabKey).length;
        return `共 ${count} 个${tab.label}`;
    }

    // 获取空状态提示
    getEmptyStateText(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        return `未找到匹配的${tab.label}`;
    }

    // 获取空选择状态提示
    getEmptySelectedText(): string {
        return '暂无已选项目';
    }

    // 获取空选择状态提示详情
    getEmptySelectedTip(): string {
        return '请在左侧选择需要分配的项目';
    }

    // 获取项目图标
    getItemIcon(type: UpmsScope): string {
        switch (type) {
            case UpmsScope.ORG:
                return 'apartment';
            case UpmsScope.ROLE:
                return 'safety-certificate';
            case UpmsScope.USER:
                return 'user';
            case UpmsScope.POST:
                return 'idcard';
            default:
                return 'idcard';
        }
    }

    // 获取项目标签
    getItemLabel(type: UpmsScope): string {
        switch (type) {
            case UpmsScope.ORG:
                return '组织架构';
            case UpmsScope.ROLE:
                return '角色';
            case UpmsScope.USER:
                return '用户';
            case UpmsScope.POST:
                return '岗位';
            default:
                return '未知';
        }
    }

    // 获取标签颜色
    getTagColor(type: UpmsScope): string {
        switch (type) {
            case UpmsScope.ORG:
                return 'blue';
            case UpmsScope.ROLE:
                return 'green';
            case UpmsScope.USER:
                return 'orange';
            case UpmsScope.POST:
                return 'purple';
            default:
                return 'default';
        }
    }

    // 获取项目显示名称
    getItemDisplayName(scope: FlowUpmsScope): string {
        const tab = this.tabs.find(t => t.key === scope.scope);
        if (!tab) return '';

        const item = tab.items.find(i => i.key === scope.scopeValue);
        return item ? item.value : '';
    }

    // 检查项目是否被选中
    isItemSelected(tabKey: UpmsScope, itemKey: number): boolean {
        return this.flowUpmsScopes.some(s =>
            s.scope === tabKey && s.scopeValue === itemKey
        );
    }

    // 获取排序后的显示数据
    getSortedDisplayData(): FlowUpmsScopeDisplay[] {
        // 定义排序优先级
        const sortOrder = {
            [UpmsScope.ORG]: 1,
            [UpmsScope.ROLE]: 2,
            [UpmsScope.USER]: 3,
            [UpmsScope.POST]: 4
        };

        return this.flowUpmsScopes
            .map(scope => ({
                ...scope,
                displayName: this.getItemDisplayName(scope),
                icon: this.getItemIcon(scope.scope),
                label: this.getItemLabel(scope.scope)
            }))
            .sort((a, b) => {
                // 首先按类型排序
                const typeOrder = sortOrder[a.scope] - sortOrder[b.scope];
                if (typeOrder !== 0) return typeOrder;

                // 然后按名称排序
                return a.displayName.localeCompare(b.displayName);
            });
    }

    // 获取分组后的显示数据
    getGroupedDisplayData(): GroupedDisplayData[] {
        const groupedData: GroupedDisplayData[] = [];

        // 为每个类型创建分组
        this.tabs.forEach(tab => {
            const items = this.flowUpmsScopes
                .filter(scope => scope.scope === tab.key)
                .map(scope => ({
                    ...scope,
                    displayName: this.getItemDisplayName(scope),
                    icon: this.getItemIcon(scope.scope),
                    label: this.getItemLabel(scope.scope)
                }))
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            if (items.length > 0) {
                groupedData.push({
                    scope: tab.key,
                    label: tab.label,
                    icon: tab.icon,
                    items: items
                });
            }
        });

        return groupedData;
    }

    // 跟踪函数，用于优化 ngFor 性能
    trackByKey(index: number, item: KV<number, string>): number {
        return item.key;
    }

    // 跟踪函数，用于优化 flowUpmsScopes 的 ngFor 性能
    trackByScope(index: number, item: FlowUpmsScope): string {
        return `${item.scope}-${item.scopeValue}`;
    }

    // 跟踪函数，用于优化分组的 ngFor 性能
    trackByGroup(index: number, item: GroupedDisplayData): UpmsScope {
        return item.scope;
    }
}
