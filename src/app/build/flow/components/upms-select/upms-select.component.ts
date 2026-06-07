import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {KV} from "../../../erupt/model/util.model";
import {FlowUpmsScope, UpmsScope} from "@flow/model/flow.model";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {I18NService} from "@core";

interface TabData {
    key: UpmsScope;
    icon: string;
    items: KV<number, string>[];
    searchText: string;
}

// Extended FlowUpmsScope with display information
interface FlowUpmsScopeDisplay extends FlowUpmsScope {
    displayName: string;
    icon: string;
    label: string;
}

// Grouped display data
interface GroupedDisplayData {
    scope: UpmsScope;
    icon: string;
    items: FlowUpmsScopeDisplay[];
}

@Component({
    standalone: false,
    selector: 'erupt-upms-select',
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
            icon: 'user',
            items: [],
            searchText: null
        },
        {
            key: UpmsScope.ROLE,
            icon: 'safety-certificate',
            items: [],
            searchText: null
        },
        {
            key: UpmsScope.POST,
            icon: 'idcard',
            items: [],
            searchText: null
        },
        {
            key: UpmsScope.ORG,
            icon: 'apartment',
            items: [],
            searchText: null
        }
    ];

    constructor(private upmsDataService: UpmsDataService,
                public i18n: I18NService
    ) {

    }

    ngOnInit() {
        this.loadData();
    }

    private loadData() {
        // Load user data
        this.tabs.find(tab => tab.key === UpmsScope.USER)!.items = this.upmsDataService.upmsData.users;
        this.tabs.find(tab => tab.key === UpmsScope.POST)!.items = this.upmsDataService.upmsData.posts;
        this.tabs.find(tab => tab.key === UpmsScope.ROLE)!.items = this.upmsDataService.upmsData.roles;
        this.tabs.find(tab => tab.key === UpmsScope.ORG)!.items = this.upmsDataService.upmsData.orgs;
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
        // Check whether the item is already in flowUpmsScopes
        const isSelected = this.flowUpmsScopes.some(s =>
            s.scope === tabKey && s.scopeValue === item.key
        );

        if (!isSelected) {
            // Add to flowUpmsScopes
            const scopeItem: FlowUpmsScope = {
                scope: tabKey,
                scopeValue: item.key
            };
            this.flowUpmsScopes.push(scopeItem);
        } else {
            // Remove from flowUpmsScopes
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
        // Remove from flowUpmsScopes
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
            // Clear items of the specified type
            this.flowUpmsScopes = this.flowUpmsScopes.filter(s => s.scope !== tabKey);
        } else {
            // Clear all items
            this.flowUpmsScopes = [];
        }

        this.emitChanges();
    }


    private emitChanges() {
        this.flowUpmsScopesChange.emit(this.flowUpmsScopes);
    }

    // Get the filtered item list
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

    // Get the current tab
    get currentTab(): TabData {
        return this.tabs[this.activeTab];
    }

    // Get list title
    getListTitle(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        const count = this.getFilteredItems(tabKey).length;
        return `共 ${count} 个${this.i18n.fanyi(tab.key)}`;
    }

    // Get empty state hint text
    getEmptyStateText(tabKey: UpmsScope): string {
        const tab = this.tabs.find(t => t.key === tabKey);
        if (!tab) return '';

        return `未找到匹配的${this.i18n.fanyi(tab.key)}`;
    }

    // Get empty selection state hint text
    getEmptySelectedText(): string {
        return '暂无已选项目';
    }

    // Get empty selection state hint detail
    getEmptySelectedTip(): string {
        return '请在左侧选择需要分配的项目';
    }

    // Get item icon
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

    // Get item label
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

    // Get tag color
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

    // Get item display name
    getItemDisplayName(scope: FlowUpmsScope): string {
        const tab = this.tabs.find(t => t.key === scope.scope);
        if (!tab) return '';

        const item = tab.items.find(i => i.key === scope.scopeValue);
        return item ? item.value : '';
    }

    // Check whether an item is selected
    isItemSelected(tabKey: UpmsScope, itemKey: number): boolean {
        return this.flowUpmsScopes.some(s =>
            s.scope === tabKey && s.scopeValue === itemKey
        );
    }

    // Get sorted display data
    getSortedDisplayData(): FlowUpmsScopeDisplay[] {
        // Define sort priority
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
                // Sort by type first
                const typeOrder = sortOrder[a.scope] - sortOrder[b.scope];
                if (typeOrder !== 0) return typeOrder;

                // Then sort by name
                return a.displayName.localeCompare(b.displayName);
            });
    }

    // Get grouped display data
    getGroupedDisplayData(): GroupedDisplayData[] {
        const groupedData: GroupedDisplayData[] = [];

        // Create a group for each type
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
                    icon: tab.icon,
                    items: items
                });
            }
        });

        return groupedData;
    }

    // Track function for optimizing ngFor performance
    trackByKey(index: number, item: KV<number, string>): number {
        return item.key;
    }

    // Track function for optimizing flowUpmsScopes ngFor performance
    trackByScope(index: number, item: FlowUpmsScope): string {
        return `${item.scope}-${item.scopeValue}`;
    }

    // Track function for optimizing grouped ngFor performance
    trackByGroup(index: number, item: GroupedDisplayData): UpmsScope {
        return item.scope;
    }
}
