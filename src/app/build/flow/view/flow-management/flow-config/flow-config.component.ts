import {Component, EventEmitter, HostListener, OnInit, Output, ViewChild} from '@angular/core';
import {NzPopoverComponent} from 'ng-zorro-antd/popover';
import {IconColorConfig} from '@flow/components/icon-color-picker/icon-color-picker.component';
import {VL} from "../../../../erupt/model/erupt-field.model";
import {FlowApiService} from "@flow/service/FlowApiService";
import {FlowConfig, FlowGroup} from "@flow/model/flow.model";
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
    selector: 'app-flow-config',
    templateUrl: './flow-config.component.html',
    styleUrls: ['./flow-config.component.less']
})
export class FlowConfigComponent implements OnInit {

    flowConfig: FlowConfig;

    iconPickVisible: boolean = false;

    // 当前步骤
    currentStep = 1;

    eruptFlows: VL[] = [];

    // 分组选项
    groupOptions: FlowGroup[] = [];

    // 提交权限选项
    submitPermissionOptions = [
        {label: '全员', value: 'all'},
        {label: '部门主管', value: 'manager'},
        {label: '指定人员', value: 'specific'}
    ];

    @ViewChild('iconPopover') iconPopover!: NzPopoverComponent;

    @Output() closeConfig = new EventEmitter();

    constructor(private flowApiService: FlowApiService, private modal: NzModalService,) {

    }

    ngOnInit(): void {
        this.flowConfig = {
            icon: 'fa fa-user',
            color: '#1890ff',
            setting: {}
        };

        this.flowApiService.eruptFlows().subscribe(res => {
            this.eruptFlows = res.data;
        })
        this.flowApiService.groupList().subscribe(res => {
            this.groupOptions = res.data;
        });
    }

    // 监听点击事件，关闭图标选择器
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        // Popover会自动处理点击外部关闭
    }

    // 切换步骤
    switchStep(step: number): void {
        this.currentStep = step;
    }

    // 处理图标颜色配置变化
    onIconColorConfigChange(config: IconColorConfig): void {
        this.flowConfig.icon = config.icon;
        this.flowConfig.color = config.color;
        this.iconPickVisible = false;
    }

    iconPickVisibleChange(value: boolean): void {
        this.iconPickVisible = value;
    }

    // 预览
    preview(): void {
        console.log('预览审批流程');
    }

    // 发布
    publish(): void {

    }

    close(): void {
        this.modal.confirm({
            nzTitle: '提示',
            nzContent: '是否放弃当前编辑？',
            nzOkText: '确定',
            nzCancelText: '取消',
            nzOnOk: () => {
                this.modal.closeAll();
                this.closeConfig.emit();
            }
        });
    }


}
