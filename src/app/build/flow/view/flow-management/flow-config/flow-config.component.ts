import {AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {NzPopoverComponent} from 'ng-zorro-antd/popover';
import {IconColorConfig} from '@flow/components/icon-color-picker/icon-color-picker.component';
import {EruptFieldModel, VL} from "../../../../erupt/model/erupt-field.model";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowConfig, FlowGroup} from "@flow/model/flow.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {FormSize} from "../../../../erupt/model/erupt.enum";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {FlowDataService} from "@flow/service/flow-data.service";
import {UpmsSelectComponent} from "../../../../erupt/components/upms-select/upms-select.component";

@Component({
    selector: 'app-flow-config',
    templateUrl: './flow-config.component.html',
    styleUrls: ['./flow-config.component.less']
})
export class FlowConfigComponent implements OnInit, AfterViewInit {

    @Input() flowId: number;

    flowConfig: FlowConfig;

    eruptBuild: EruptBuildModel;

    flexNodes: FlexNodeModel[] = [];

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
        {label: '指定人员', value: 'specific'},
        {label: '均不可提交', value: 'no'}
    ];

    @ViewChild('iconPopover') iconPopover!: NzPopoverComponent;

    @Output() closeConfig = new EventEmitter();

    constructor(private flowApiService: FlowApiService, private modal: NzModalService,
                private msg: NzMessageService,
                private flowDataService: FlowDataService) {

    }

    ngOnInit(): void {
        // 初始化默认配置
        this.flowConfig = {
            icon: 'fa fa-user',
            color: '#1890ff',
            setting: {}
        };

        // 加载分组选项
        this.flowApiService.groupList().subscribe(res => {
            this.groupOptions = res.data;

            // 如果是编辑模式，在分组选项加载完成后获取配置数据
            if (this.flowId) {
                this.flowApiService.configGet(this.flowId).subscribe(configRes => {
                    if (configRes.success && configRes.data) {
                        this.flowConfig = configRes.data;
                        // 确保flowGroup对象引用匹配
                        this.matchFlowGroupReference();
                        if (this.flowConfig.erupt) {
                            this.changeErupt(this.flowConfig.erupt)
                        }
                    }
                });
            }
        });

        this.flowApiService.eruptFlows().subscribe(res => {
            this.eruptFlows = res.data;
        });
        this.flowApiService.flexNodes().subscribe(res => {
            this.flexNodes = res.data;
        })
    }

    ngAfterViewInit(): void {
        // 视图初始化完成后的逻辑
        // 可以在这里进行一些需要访问视图子组件的操作
    }

    changeErupt(erupt: string) {
        this.flowApiService.eruptFlowBuild(erupt).subscribe(res => {
            this.eruptBuild = res.data;
            this.eruptBuild.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
            this.eruptBuild.eruptModel.eruptFieldModelMap = new Map<string, EruptFieldModel>();
            this.eruptBuild.eruptModel.eruptFieldModels.forEach(field => {
                this.eruptBuild.eruptModel.eruptFieldModelMap.set(field.fieldName, field);
            })
        })
    }

    changeSubmitPermission(permission: string) {
        if (permission == 'specific') {
            this.modal.create({
                nzTitle: '请选择可见范围',
                nzWidth: '880px',
                nzStyle: {top: '30px'},
                nzBodyStyle: {padding: '0'},
                nzContent: UpmsSelectComponent
            })
        }
    }

    /**
     * 匹配flowGroup对象引用，确保回显正确
     */
    private matchFlowGroupReference(): void {
        if (this.flowConfig.flowGroup && this.groupOptions.length > 0) {
            // 根据ID找到匹配的分组对象
            const matchedGroup = this.groupOptions.find(group => group.id === this.flowConfig.flowGroup.id);
            if (matchedGroup) {
                this.flowConfig.flowGroup = matchedGroup;
            }
        }
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
        if (this.flowId) {
            this.flowApiService.configUpdate(this.flowConfig).subscribe(res => {
                if (res.success) {
                    this.msg.success('发布成功');
                    this.closeConfig.emit();
                }
            })
        } else {
            this.flowApiService.configAdd(this.flowConfig).subscribe(res => {
                if (res.success) {
                    this.msg.success('发布成功');
                    this.closeConfig.emit();
                }
            })
        }
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
