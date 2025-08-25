import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";
import {KV} from "../../../erupt/model/util.model";
import {FlowUpmsScope, UpmsScope} from "@flow/model/flow.model";

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
            key: UpmsScope.ORG,
            label: '组织架构',
            icon: 'apartment',
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
            key: UpmsScope.USER,
            label: '用户',
            icon: 'user',
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

    constructor(private flowUpmsApiService: FlowUpmsApiService) {
    }

    ngOnInit() {
        this.loadData();
    }

    private loadData() {
        // 加载用户数据
        this.flowUpmsApiService.users().subscribe(res => {
            this.tabs.find(tab => tab.key === UpmsScope.USER)!.items = res.data;
        });

        // 加载岗位数据
        this.flowUpmsApiService.posts().subscribe(res => {
            this.tabs.find(tab => tab.key === UpmsScope.POST)!.items = res.data;
        });

        // 加载角色数据
        this.flowUpmsApiService.roles().subscribe(res => {
            this.tabs.find(tab => tab.key === UpmsScope.ROLE)!.items = res.data;
        });

        // TODO: 加载组织数据
        // this.flowUpmsApiService.orgs().subscribe(res => {
        //     this.tabs.find(tab => tab.key === UpmsScope.ORG)!.items = res.data;
        // });
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

        // 更新对应项目的选中状态
        const tab = this.tabs.find(t => t.key === scope.scope);
        if (tab) {
            const item = tab.items.find(i => i.key === scope.scopeValue);
            if (item) {
                item.checked = false;
            }
        }

        this.emitChanges();
    }

    onClearAll(tabKey: UpmsScope) {
        // 从 flowUpmsScopes 移除该类型的所有项目
        this.flowUpmsScopes = this.flowUpmsScopes.filter(s => s.scope !== tabKey);

        // 取消所有项目的选中状态
        const tab = this.tabs.find(t => t.key === tabKey);
        if (tab) {
            tab.items.forEach(item => {
                item.checked = false;
            });
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

    // 获取项目显示名称
    getItemDisplayName(scope: FlowUpmsScope): string {
        const tab = this.tabs.find(t => t.key === scope.scope);
        if (!tab) return '';

        const item = tab.items.find(i => i.key === scope.scopeValue);
        return item ? item.value : '';
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

    // 获取当前标签页的已选项目数量
    getCurrentTabSelectedCount(): number {
        return this.flowUpmsScopes.filter(s => s.scope === this.currentTabKey).length;
    }

    // 跟踪函数，用于优化 ngFor 性能
    trackByKey(index: number, item: KV<number, string>): number {
        return item.key;
    }

    // 跟踪函数，用于优化 flowUpmsScopes 的 ngFor 性能
    trackByScope(index: number, item: FlowUpmsScope): string {
        return `${item.scope}-${item.scopeValue}`;
    }
}
