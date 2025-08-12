import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

export interface BaseItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface Role extends BaseItem {
  type: 'role';
}

export interface User extends BaseItem {
  type: 'user';
  email?: string;
  department?: string;
}

export interface Organization extends BaseItem {
  type: 'org';
  level?: number;
  parentId?: string;
}

export interface Position extends BaseItem {
  type: 'position';
  department?: string;
  level?: string;
}

export type SelectableItem = Role | User | Organization | Position;

@Component({
  selector: 'app-upms-select',
  templateUrl: './upms-select.component.html',
  styleUrls: ['./upms-select.component.less']
})
export class UpmsSelectComponent implements OnInit {
  @Input() roles: Role[] = [];
  @Input() users: User[] = [];
  @Input() organizations: Organization[] = [];
  @Input() positions: Position[] = [];
  @Output() rolesChange = new EventEmitter<Role[]>();
  @Output() usersChange = new EventEmitter<User[]>();
  @Output() organizationsChange = new EventEmitter<Organization[]>();
  @Output() positionsChange = new EventEmitter<Position[]>();

  activeTab = 0; // 默认选择组织架构
  searchText = '';
  selectedItems: SelectableItem[] = [];

  tabs = [
    { key: 'org', label: '组织架构', icon: 'apartment' },
    { key: 'roles', label: '角色', icon: 'safety-certificate' },
    { key: 'users', label: '用户', icon: 'usergroup-add' },
    { key: 'positions', label: '岗位', icon: 'idcard' }
  ];

  constructor() {
    // Angular 16 中图标会自动注册，不需要手动注册
  }

  ngOnInit() {
    // 初始化默认数据
    this.initializeDefaultData();
    this.updateSelectedItems();
  }

  private initializeDefaultData() {
    // 组织架构默认数据
    if (this.organizations.length === 0) {
      this.organizations = [
        { id: '1', name: '总公司', checked: false, type: 'org', level: 1 },
        { id: '2', name: '技术部', checked: true, type: 'org', level: 2, parentId: '1' },
        { id: '3', name: '人事部', checked: true, type: 'org', level: 2, parentId: '1' },
        { id: '4', name: '财务部', checked: false, type: 'org', level: 2, parentId: '1' }
      ];
    }

    // 角色默认数据
    if (this.roles.length === 0) {
      this.roles = [
        { id: '1', name: '人事', checked: false, type: 'role' },
        { id: '2', name: '法务', checked: true, type: 'role' },
        { id: '3', name: '财务', checked: true, type: 'role' },
        { id: '4', name: 'IT', checked: true, type: 'role' },
        { id: '5', name: '行政', checked: false, type: 'role' }
      ];
    }

    // 用户默认数据
    if (this.users.length === 0) {
      this.users = [
        { id: '1', name: '张三', checked: false, type: 'user', email: 'zhangsan@company.com', department: '技术部' },
        { id: '2', name: '李四', checked: true, type: 'user', email: 'lisi@company.com', department: '人事部' },
        { id: '3', name: '王五', checked: true, type: 'user', email: 'wangwu@company.com', department: '财务部' },
        { id: '4', name: '赵六', checked: false, type: 'user', email: 'zhaoliu@company.com', department: '技术部' }
      ];
    }

    // 岗位默认数据
    if (this.positions.length === 0) {
      this.positions = [
        { id: '1', name: '前端工程师', checked: false, type: 'position', department: '技术部', level: 'P5' },
        { id: '2', name: '后端工程师', checked: true, type: 'position', department: '技术部', level: 'P6' },
        { id: '3', name: '人事专员', checked: true, type: 'position', department: '人事部', level: 'P4' },
        { id: '4', name: '财务专员', checked: false, type: 'position', department: '财务部', level: 'P4' }
      ];
    }
  }

  onTabChange(tabIndex: number) {
    this.activeTab = tabIndex;
    this.searchText = ''; // 切换标签时清空搜索
  }

  onItemToggle(item: SelectableItem) {
    item.checked = !item.checked;
    this.updateSelectedItems();
    this.emitChanges();
  }

  onItemRemove(item: SelectableItem) {
    const foundItem = this.getCurrentItems().find(i => i.id === item.id);
    if (foundItem) {
      foundItem.checked = false;
      this.updateSelectedItems();
      this.emitChanges();
    }
  }

  onClearAll() {
    this.getCurrentItems().forEach(item => item.checked = false);
    this.updateSelectedItems();
    this.emitChanges();
  }

  private updateSelectedItems() {
    this.selectedItems = this.getCurrentItems().filter(item => item.checked);
  }

  private emitChanges() {
    switch (this.currentTabKey) {
      case 'org':
        this.organizationsChange.emit(this.organizations);
        break;
      case 'roles':
        this.rolesChange.emit(this.roles);
        break;
      case 'users':
        this.usersChange.emit(this.users);
        break;
      case 'positions':
        this.positionsChange.emit(this.positions);
        break;
    }
  }

  private getCurrentItems(): SelectableItem[] {
    switch (this.currentTabKey) {
      case 'org':
        return this.organizations;
      case 'roles':
        return this.roles;
      case 'users':
        return this.users;
      case 'positions':
        return this.positions;
      default:
        return this.roles;
    }
  }

  get filteredItems() {
    const items = this.getCurrentItems();
    if (!this.searchText) {
      return items;
    }
    return items.filter(item =>
      item.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  get selectedCount() {
    return this.selectedItems.length;
  }

  get currentTabKey() {
    return this.tabs[this.activeTab]?.key || 'org';
  }

  get currentTabLabel() {
    return this.tabs[this.activeTab]?.label || '组织架构';
  }

  // 性能优化：trackBy函数
  trackByItem(index: number, item: SelectableItem): string {
    return item.id;
  }

  // 清空搜索
  clearSearch() {
    this.searchText = '';
  }

  // 获取当前标签页信息
  getCurrentTabInfo() {
    return this.tabs[this.activeTab];
  }

  // 获取搜索框占位符
  getSearchPlaceholder(): string {
    switch (this.currentTabKey) {
      case 'org':
        return '搜索组织名称...';
      case 'roles':
        return '搜索角色名称...';
      case 'users':
        return '搜索用户姓名...';
      case 'positions':
        return '搜索岗位名称...';
      default:
        return '搜索...';
    }
  }

  // 获取列表标题
  getListTitle(): string {
    const count = this.filteredItems.length;
    switch (this.currentTabKey) {
      case 'org':
        return `共 ${count} 个组织`;
      case 'roles':
        return `共 ${count} 个角色`;
      case 'users':
        return `共 ${count} 个用户`;
      case 'positions':
        return `共 ${count} 个岗位`;
      default:
        return `共 ${count} 个项目`;
    }
  }

  // 获取空状态提示
  getEmptyStateText(): string {
    switch (this.currentTabKey) {
      case 'org':
        return '未找到匹配的组织';
      case 'roles':
        return '未找到匹配的角色';
      case 'users':
        return '未找到匹配的用户';
      case 'positions':
        return '未找到匹配的岗位';
      default:
        return '未找到匹配的项目';
    }
  }

  // 获取已选标题
  getSelectedTitle(): string {
    const count = this.selectedCount;
    switch (this.currentTabKey) {
      case 'org':
        return `已选: ${count}个组织`;
      case 'roles':
        return `已选: ${count}个角色`;
      case 'users':
        return `已选: ${count}个用户`;
      case 'positions':
        return `已选: ${count}个岗位`;
      default:
        return `已选: ${count}个项目`;
    }
  }

  // 获取空选择状态提示
  getEmptySelectedText(): string {
    switch (this.currentTabKey) {
      case 'org':
        return '暂无已选组织';
      case 'roles':
        return '暂无已选角色';
      case 'users':
        return '暂无已选用户';
      case 'positions':
        return '暂无已选岗位';
      default:
        return '暂无已选项目';
    }
  }

  // 获取空选择状态提示详情
  getEmptySelectedTip(): string {
    switch (this.currentTabKey) {
      case 'org':
        return '请在左侧选择需要分配的组织';
      case 'roles':
        return '请在左侧选择需要分配的角色';
      case 'users':
        return '请在左侧选择需要分配的用户';
      case 'positions':
        return '请在左侧选择需要分配的岗位';
      default:
        return '请在左侧选择需要分配的项目';
    }
  }
}
