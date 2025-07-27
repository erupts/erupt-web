import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzPopoverComponent} from 'ng-zorro-antd/popover';
import {IconColorConfig} from '@flow/components/icon-color-picker/icon-color-picker.component';

interface ProcessAdmin {
  id: string;
  name: string;
  avatar: string;
}

@Component({
  selector: 'app-flow-config',
  templateUrl: './flow-config.component.html',
  styleUrls: ['./flow-config.component.less']
})
export class FlowConfigComponent implements OnInit {

  // 表单数据
  flowForm: FormGroup;

  // 当前步骤
  currentStep = 1;

  // 保存状态
  saveStatus = '草稿 (保存于1分钟前)';

  // 不完善项目数量
  incompleteItems = 2;

  // 当前选中的图标和颜色
  selectedIcon = 'fa fa-user';
  selectedColor = '#1890ff';

  // 分组选项
  groupOptions = [
    { label: '防疫专题', value: 'epidemic' },
    { label: '人事管理', value: 'hr' },
    { label: '财务管理', value: 'finance' },
    { label: '项目管理', value: 'project' }
  ];

  // 提交权限选项
  submitPermissionOptions = [
    { label: '全员', value: 'all' },
    { label: '部门主管', value: 'manager' },
    { label: '指定人员', value: 'specific' }
  ];

  // 流程管理员列表
  processAdmins: ProcessAdmin[] = [
    {
      id: '1',
      name: '李月鹏',
      avatar: '月鹏'
    }
  ];



  @ViewChild('iconPopover') iconPopover!: NzPopoverComponent;

  constructor(private fb: FormBuilder) {
    this.flowForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      group: ['epidemic', [Validators.required]],
      submitPermission: ['all', [Validators.required]],
      showOnWorkbench: [false],
      prohibitAdminManage: [false]
    });
  }

  ngOnInit(): void {
    // 监听表单变化，更新不完善项目数量
    this.flowForm.valueChanges.subscribe(() => {
      this.updateIncompleteItems();
    });
  }

  // 监听点击事件，关闭图标选择器
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Popover会自动处理点击外部关闭
  }



  // 更新不完善项目数量
  updateIncompleteItems(): void {
    let count = 0;
    if (!this.flowForm.get('name')?.value) count++;
    if (this.processAdmins.length === 0) count++;
    this.incompleteItems = count;
  }

  // 切换步骤
  switchStep(step: number): void {
    this.currentStep = step;
  }

  // 显示/隐藏图标选择器
  // toggleIconSelector(event: Event): void { // This method is removed
  //   event.stopPropagation();
  //   this.showIconSelector = !this.showIconSelector;
  //   if (this.showIconSelector) {
  //     // 打开选择器时，初始化预览为当前选择
  //     this.previewIcon = this.selectedIcon;
  //     this.previewColor = this.selectedColor;
  //   }
  // }

  // 处理图标颜色配置变化
  onIconColorConfigChange(config: IconColorConfig): void {
    this.selectedIcon = config.icon;
    this.selectedColor = config.color;
    // 关闭Popover
    if (this.iconPopover) {
      this.iconPopover.hide();
    }
  }

  // 获取当前图标样式
  getCurrentIconStyle(): string {
    return `background-color: ${this.selectedColor}`;
  }

  // 添加流程管理员
  addProcessAdmin(): void {
    // 这里可以实现添加管理员的功能
    console.log('添加流程管理员');
  }

  // 删除流程管理员
  deleteProcessAdmin(adminId: string): void {
    this.processAdmins = this.processAdmins.filter(admin => admin.id !== adminId);
    this.updateIncompleteItems();
  }

  // 设置管理员权限
  setAdminPermission(adminId: string): void {
    // 这里可以实现权限设置功能
    console.log('设置管理员权限', adminId);
  }

  // 预览
  preview(): void {
    console.log('预览审批流程');
  }

  // 发布
  publish(): void {
    if (this.flowForm.valid && this.processAdmins.length > 0) {
      console.log('发布审批流程', this.flowForm.value);
    } else {
      console.log('表单验证失败，无法发布');
    }
  }

  // 返回
  goBack(): void {
    console.log('返回上一页');
  }

  // 获取表单错误信息
  getErrorMessage(controlName: string): string {
    const control = this.flowForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(controlName)}为空,请填写`;
      }
    }
    return '';
  }

  // 获取字段标签
  getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      name: '名称',
      group: '分组',
      submitPermission: '提交权限'
    };
    return labels[controlName] || '';
  }


}
