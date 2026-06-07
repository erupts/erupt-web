import {AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {NzPopoverComponent} from 'ng-zorro-antd/popover';
import {IconColorConfig} from '@flow/components/icon-color-picker/icon-color-picker.component';
import {VL} from "../../../../erupt/model/erupt-field.model";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowConfig, FlowGroup, FlowPermission, PrintSetting} from "@flow/model/flow.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {EditType, FormSize} from "../../../../erupt/model/erupt.enum";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {UpmsSelectComponent} from "@flow/components/upms-select/upms-select.component";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {DataHandlerService} from "../../../../erupt/service/data-handler.service";
import html2canvas from "html2canvas";
import {DataService} from "@shared/service/data.service";
import {NoticeChannel} from "@shared/model/user.model";
import {PrintTemplate, PrintVar} from "@shared/component/print-template/print-template";

@Component({
    standalone: false,
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

    // Current step
    currentStep = 1;

    eruptFlows: VL[] = [];

    // Group options
    groupOptions: FlowGroup[] = [];

    noticeChannel: NoticeChannel[];

    shotLoading = false;

    @ViewChild('iconPopover') iconPopover!: NzPopoverComponent;

    @Output() closeConfig = new EventEmitter();

    constructor(private flowApiService: FlowApiService, private modal: NzModalService,
                private dataHandlerService: DataHandlerService,
                private msg: NzMessageService,
                private dataService: DataService,
                private upmsDataService: UpmsDataService) {

    }

    ngOnInit(): void {
        // Initialize default configuration
        this.flowConfig = new FlowConfig();

        // Load group options
        this.flowApiService.groupList().subscribe(res => {
            this.groupOptions = res.data;

            // In edit mode, fetch config data after group options have loaded
            if (this.flowId) {
                this.flowApiService.configGet(this.flowId).subscribe(configRes => {
                    if (configRes.success && configRes.data) {
                        this.flowConfig = configRes.data;
                        // Ensure the flowGroup object reference matches
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
        this.dataService.noticeChannels().subscribe(res => {
            this.noticeChannel = res.data;
        })
    }

    ngAfterViewInit(): void {
        // Logic to run after the view has been initialized
        // Operations that require access to view child components can be performed here
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
                nzDraggable: true,
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
     * Match the flowGroup object reference to ensure correct display binding.
     */
    private matchFlowGroupReference(): void {
        if (this.flowConfig.flowGroup && this.groupOptions.length > 0) {
            // Find the matching group object by ID
            const matchedGroup = this.groupOptions.find(group => group.id === this.flowConfig.flowGroup.id);
            if (matchedGroup) {
                this.flowConfig.flowGroup = matchedGroup;
            }
        }
    }

    // Listen for click events to close the icon picker
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        // The Popover handles closing on outside click automatically
    }

    // Switch step
    switchStep(step: number): void {
        this.currentStep = step;
    }

    // Handle icon color config changes
    onIconColorConfigChange(config: IconColorConfig): void {
        this.flowConfig.icon = config.icon;
        this.flowConfig.color = config.color;
        this.iconPickVisible = false;
    }

    iconPickVisibleChange(value: boolean): void {
        this.iconPickVisible = value;
    }

    // Preview
    preview(): void {
        console.log('Preview approval flow');
    }

    // Publish
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
        if (!this.flowConfig.channels || this.flowConfig.channels.length === 0) {
            this.msg.warning('请选择通知渠道');
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

    copyConfig() {
        if (this.flowConfig.rule) {
            navigator.clipboard.writeText(JSON.stringify(this.flowConfig.rule, null, 2)).then(() => {
                this.msg.success('已复制到剪贴板');
            });
        }
    }

    async shot() {
        this.shotLoading = true;
        const el = document.getElementById('flow-canvas');
        const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${this.flowConfig.name || 'flow'}.png`;
        link.click();
        link.remove()
        this.shotLoading = false;
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

    configPrintTemplate() {
        let vars: PrintVar[] = []
        vars.push({value: 'flow.no', label: '流程-流水号'});
        vars.push({value: 'flow.initiatorUser.name', label: '流程-发起人'});
        vars.push({value: 'flow.createTime', label: '流程-发起时间'});
        vars.push({value: 'flow.status', label: '流程-状态'});
        vars.push({
            value: 'flow.tasks',
            label: '流程-流转记录',
            template: `
                <table style="width:100%;border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #d9d9d9;padding: 8px;background: #f5f5f5;font-weight: 600;">审批人</th>
                            <th style="border: 1px solid #d9d9d9;padding: 8px;background: #f5f5f5;font-weight: 600;">任务状态</th>
                            <th style="border: 1px solid #d9d9d9;padding: 8px;background: #f5f5f5;font-weight: 600;">审批意见</th>
                            <th style="border: 1px solid #d9d9d9;padding: 8px;background: #f5f5f5;font-weight: 600;">创建时间</th>
                            <th style="border: 1px solid #d9d9d9;padding: 8px;background: #f5f5f5;font-weight: 600;">审批时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!--#foreach($task in $flow.tasks)-->
                        <tr>
                            <td style="border: 1px solid #d9d9d9;padding: 8px;">$!{task.assigneeUser.name}</td>
                            <td style="border: 1px solid #d9d9d9;padding: 8px;">$!{task.taskStatusText}</td>
                            <td style="border: 1px solid #d9d9d9;padding: 8px;">
                                $!{task.comment}<!--#if($task.signature)--><br/><img src="$!task.signature" style="border:1px solid #f0f0f0;margin: 4px 0 0;width: 160px;" alt="签名"><!--#end-->
                            </td>
                            <td style="border: 1px solid #d9d9d9;padding: 8px;">$!{task.createTime}</td>
                            <td style="border: 1px solid #d9d9d9;padding: 8px;">$!{task.completedAt}</td>
                        </tr>
                        <!--#end-->
                    </tbody>
                </table>
            `,
            vars: [
                {value: "task.assigneeUser.name", label: "审批人"},
                {value: "task.taskStatusText", label: "任务状态"},
                {value: "task.comment", label: "审批意见"},
                {value: "task.createTime", label: "创建时间"},
                {value: "task.completedAt", label: "审批时间"},
            ]
        });
        if (this.eruptBuild && this.eruptBuild.eruptModel) {
            this.eruptBuild.eruptModel.eruptFieldModels.forEach(f => {
                if (f.eruptFieldJson.edit.title) {
                    vars.push({
                        value: f.fieldName,
                        label: f.eruptFieldJson.edit.title
                    })
                }
            })
        }
        let ref = this.modal.create({
            nzTitle: '配置打印模板',
            nzDraggable: true,
            nzContent: PrintTemplate,
            nzWidth: '900px',
            nzStyle: {top: '30px'},
            nzMaskClosable: false,
            nzKeyboard: false,
            nzOnOk: () => {
                this.flowConfig.setting.printTemplate = ref.getContentComponent().getContent();
                this.flowConfig.setting.printPageConfig = ref.getContentComponent().getPageConfig();
            }
        })
        ref.getContentComponent().height = 460;
        ref.getContentComponent().vars = vars;
        ref.getContentComponent().value = this.flowConfig.setting.printTemplate;
        ref.getContentComponent().pageConfig = this.flowConfig.setting.printPageConfig || {
            paperSize: 'A4',
            orientation: 'portrait',
            marginTop: 10,
            marginRight: 10,
            marginBottom: 10,
            marginLeft: 10
        };
    }

    protected readonly EditType = EditType;
    protected readonly PrintSetting = PrintSetting;
}
