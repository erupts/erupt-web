import {AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {NzPopoverComponent} from 'ng-zorro-antd/popover';
import {IconColorConfig} from '@flow/components/icon-color-picker/icon-color-picker.component';
import {VL} from "../../../../erupt/model/erupt-field.model";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowConfig, FlowGroup, FlowPermission, FlowUpmsScope, UpmsScope} from "@flow/model/flow.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {FormSize} from "../../../../erupt/model/erupt.enum";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {UpmsSelectComponent} from "@flow/components/upms-select/upms-select.component";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {DataHandlerService} from "../../../../erupt/service/data-handler.service";

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

    @ViewChild('iconPopover') iconPopover!: NzPopoverComponent;

    @Output() closeConfig = new EventEmitter();

    constructor(private flowApiService: FlowApiService, private modal: NzModalService,
                private dataHandlerService: DataHandlerService,
                private msg: NzMessageService,
                private upmsDataService: UpmsDataService) {

    }

    ngOnInit(): void {
        // 初始化默认配置
        this.flowConfig = new FlowConfig();

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
            this.dataHandlerService.initErupt(res.data)
            this.eruptBuild = res.data;
            this.eruptBuild.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
        })
    }

    changeSubmitPermission(permission: FlowPermission) {
        if (permission == FlowPermission.SPECIFIC) {
            let ref = this.modal.create({
                nzTitle: '请选择可见范围',
                nzWidth: '880px',
                nzStyle: {top: '30px'},
                nzBodyStyle: {padding: '0'},
                nzContent: UpmsSelectComponent,
            })
            ref.getContentComponent().flowUpmsScopes = this.flowConfig.permissionScope || [];
            ref.getContentComponent().flowUpmsScopesChange.subscribe(scopes => {
                this.flowConfig.permissionScope = scopes;
            });
        } else {
            this.flowConfig.permissionScope = null;
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
        if (!this.flowConfig.name) {
            this.msg.warning('请输入流程名称');
            return;
        }
        if (!this.flowConfig.erupt) {
            this.msg.warning('请选择关联表');
            return;
        }
        if (!this.flowConfig.flowGroup) {
            this.msg.warning('请选择分组');
            return;
        }
        if (!this.flowConfig.permission) {
            this.msg.warning('请选择提交权限');
            return;
        }
        this.flowApiService.ruleCheck(this.flowConfig.rule).subscribe(res => {
            if (res.success) {
                if (this.flowId) {
                    this.flowApiService.configUpdate(this.flowConfig).subscribe(res => {
                        if (res.success) {
                            this.msg.success('发布成功');
                            this.closeConfig.emit();
                        }
                    })
                } else {
                    this.flowApiService.configCreate(this.flowConfig).subscribe(res => {
                        if (res.success) {
                            this.msg.success('发布成功');
                            this.closeConfig.emit();
                        }
                    })
                }
            } else {
                this.msg.error('规则校验失败请检查');
                if (res.data) {
                    this.flowConfig.rule = res.data;
                }
            }
        })
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


    protected readonly FlowPermission = FlowPermission;

    /**
     * 获取权限范围的标签颜色
     */
    getScopeTagColor(scope: string): string {
        const colorMap: { [key: string]: string } = {
            'ORG': 'blue',
            'ROLE': 'green',
            'USER': 'orange',
            'POST': 'purple'
        };
        return colorMap[scope] || 'default';
    }

    /**
     * 获取权限范围的图标
     */
    getScopeIcon(scope: string): string {
        const iconMap: { [key: string]: string } = {
            'ORG': 'apartment',
            'ROLE': 'safety-certificate',
            'USER': 'user',
            'POST': 'idcard'
        };
        return iconMap[scope] || 'question';
    }

    getScopeValue(upmsScope: FlowUpmsScope): string {
        if (upmsScope.scope == UpmsScope.USER) {
            for (let user of this.upmsDataService.users) {
                if (user.key == upmsScope.scopeValue) {
                    return user.value;
                }
            }
        } else if (upmsScope.scope == UpmsScope.ROLE) {
            for (let role of this.upmsDataService.roles) {
                if (role.key == upmsScope.scopeValue) {
                    return role.value;
                }
            }
        } else if (upmsScope.scope == UpmsScope.POST) {
            for (let post of this.upmsDataService.posts) {
                if (post.key == upmsScope.scopeValue) {
                    return post.value;
                }
            }
        } else if (upmsScope.scope == UpmsScope.ORG) {
            for (let org of this.upmsDataService.orgs) {
                if (org.key == upmsScope.scopeValue) {
                    return org.value;
                }
            }
        }
        return upmsScope.scopeValue.toString();
    }

}
