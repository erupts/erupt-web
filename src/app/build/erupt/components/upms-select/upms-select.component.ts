import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

export interface Role {
  id: string;
  name: string;
  checked: boolean;
}

@Component({
  selector: 'app-upms-select',
  templateUrl: './upms-select.component.html',
  styleUrls: ['./upms-select.component.less']
})
export class UpmsSelectComponent implements OnInit {
  @Input() roles: Role[] = [];
  @Output() rolesChange = new EventEmitter<Role[]>();

  activeTab = 1; // 使用数字索引，0: org, 1: roles, 2: groups
  searchText = '';
  selectedRoles: Role[] = [];

  tabs = [
    { key: 'org', label: '组织架构' },
    { key: 'roles', label: '角色' },
    { key: 'groups', label: '用户组' }
  ];

  constructor() {
    // Angular 16 中图标会自动注册，不需要手动注册
  }

  ngOnInit() {
    // 如果没有传入roles，使用默认示例数据
    if (this.roles.length === 0) {
      this.roles = [
        { id: '1', name: '人事', checked: false },
        { id: '2', name: '法务', checked: true },
        { id: '3', name: '财务', checked: true },
        { id: '4', name: 'IT', checked: true },
        { id: '5', name: '行政', checked: false }
      ];
    }
    this.updateSelectedRoles();
  }

  onTabChange(tabIndex: number) {
    this.activeTab = tabIndex;
  }

  onRoleToggle(role: Role) {
    role.checked = !role.checked;
    this.updateSelectedRoles();
    this.rolesChange.emit(this.roles);
  }

  onRoleRemove(role: Role) {
    const foundRole = this.roles.find(r => r.id === role.id);
    if (foundRole) {
      foundRole.checked = false;
      this.updateSelectedRoles();
      this.rolesChange.emit(this.roles);
    }
  }

  onClearAll() {
    this.roles.forEach(role => role.checked = false);
    this.updateSelectedRoles();
    this.rolesChange.emit(this.roles);
  }

  private updateSelectedRoles() {
    this.selectedRoles = this.roles.filter(role => role.checked);
  }

  get filteredRoles() {
    if (!this.searchText) {
      return this.roles;
    }
    return this.roles.filter(role =>
      role.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  get selectedCount() {
    return this.selectedRoles.length;
  }

  get currentTabKey() {
    return this.tabs[this.activeTab]?.key || 'roles';
  }
}
