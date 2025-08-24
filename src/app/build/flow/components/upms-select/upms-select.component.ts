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
    selectedItems: KV<number, string>[];
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
            searchText: '',
            selectedItems: []
        },
        {
            key: UpmsScope.ROLE,
            label: '角色',
            icon: 'safety-certificate',
            items: [],
            searchText: '',
            selectedItems: []
        },
        {
            key: UpmsScope.USER,
            label: '用户',
            icon: 'user',
            items: [],
            searchText: '',
            selectedItems: []
        },
        {
            key: UpmsScope.POST,
            label: '岗位',
            icon: 'idcard',
            items: [],
            searchText: '',
            selectedItems: []
        }
    ];

    constructor(private flowUpmsApiService: FlowUpmsApiService) {
    }

    ngOnInit() {
        this.loadData();
        this.initializeSelectedItems();
    }

    private loadData() {
        // 加载用户数据
        this.flowUpmsApiService.users().subscribe(res => {
            this.tabs.find(tab => tab.key === UpmsScope.USER)!.items = res.data;
            this.updateSelectedItems(UpmsScope.USER);
        });

        // 加载岗位数据
        this.flowUpmsApiService.posts().subscribe(res => {
            this.tabs.find(tab => tab.key === UpmsScope.POST)!.items = res.data;
            this.updateSelectedItems(UpmsScope.POST);
        });

        // 加载角色数据
        this.flowUpmsApiService.roles().subscribe(res => {
            this.tabs.find(tab => tab.key === UpmsScope.ROLE)!.items = res.data;
            this.updateSelectedItems(UpmsScope.ROLE);
        });

        // TODO: 加载组织数据
        // this.flowUpmsApiService.orgs().subscribe(res => {
        //     this.tabs.find(tab => tab.key === UpmsScope.ORG)!.items = res.data;
        //     this.updateSelectedItems(UpmsScope.ORG);
        // });
    }

    private initializeSelectedItems() {
        if (this.flowUpmsScopes && this.flowUpmsScopes.length > 0) {
            this.flowUpmsScopes.forEach(scope => {
                const tab = this.tabs.find(t => t.key === scope.scope);
                if (tab) {
                    const item = tab.items.find(i => i.key === scope.scopeValue);
                    if (item) {
                        item.checked = true;
                        tab.selectedItems.push(item);
                    }
                }
            });
        }
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
        item.checked = !item.checked;
        const tab = this.tabs.find(t => t.key === tabKey);
        
        if (!tab) return;

        if (item.checked) {
            // 添加到已选列表
            tab.selectedItems.push(item);
            
            // 添加到 flowUpmsScopes
            const scopeItem: FlowUpmsScope = {
                scope: tabKey,
                scopeValue: item.key
            };
            this.flowUpmsScopes.push(scopeItem);
        } else {
            // 从已选列表移除
            const index = tab.selectedItems.findIndex(i => i.key === item.key);
            if (index > -1) {
                tab.selectedItems.splice(index, 1);
            }
            
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

    onItemRemove(tabKey: UpmsScope, item: KV<number, string>) {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return;

        // 从已选列表移除
        const index = tab.selectedItems.findIndex(i => i.key === item.key);
        if (index > -1) {
            tab.selectedItems.splice(index, 1);
        }

        // 取消选中状态
        item.checked = false;

        // 从 flowUpmsScopes 移除
        const scopeIndex = this.flowUpmsScopes.findIndex(s => 
            s.scope === tabKey && s.scopeValue === item.key
        );
        if (scopeIndex > -1) {
            this.flowUpmsScopes.splice(scopeIndex, 1);
        }

        this.emitChanges();
    }

    onClearAll(tabKey: UpmsScope) {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return;

        // 清空已选项目
        tab.selectedItems = [];

        // 取消所有项目的选中状态
        tab.items.forEach(item => {
            item.checked = false;
        });

        // 从 flowUpmsScopes 移除该类型的所有项目
        this.flowUpmsScopes = this.flowUpmsScopes.filter(s => s.scope !== tabKey);

        this.emitChanges();
    }

    private updateSelectedItems(tabKey: UpmsScope) {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return;

        // 根据 flowUpmsScopes 更新选中状态
        tab.selectedItems = [];
        tab.items.forEach(item => {
            const isSelected = this.flowUpmsScopes.some(s => 
                s.scope === tabKey && s.scopeValue === item.key
            );
            item.checked = isSelected;
            if (isSelected) {
                tab.selectedItems.push(item);
            }
        });
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

    // 获取已选标题
    getSelectedTitle(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        const count = tab.selectedItems.length;
        return `已选: ${count}个${tab.label}`;
    }

    // 获取空选择状态提示
    getEmptySelectedText(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        return `暂无已选${tab.label}`;
    }

    // 获取空选择状态提示详情
    getEmptySelectedTip(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        return `请在左侧选择需要分配的${tab.label}`;
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

    // 跟踪函数，用于优化 ngFor 性能
    trackByKey(index: number, item: KV<number, string>): number {
        return item.key;
    }
}
