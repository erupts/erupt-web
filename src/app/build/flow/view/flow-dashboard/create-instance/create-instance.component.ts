import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {openResizableDrawer} from "@shared/component/resizable-drawer.component";
import {FormSize} from "../../../../erupt/model/erupt.enum";
import {FlowApiService} from "@flow/service/flow-api.service";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {FlowConfig} from "@flow/model/flow.model";
import {DataHandlerService} from "../../../../erupt/service/data-handler.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {EruptFlowComponent} from "@flow/components/erupt-flow/erupt-flow.component";
import {StartNode} from "@flow/model/flow-approval.model";
import {KV} from "../../../../erupt/model/util.model";
import {EruptUser} from "../../../../cube/model/dashboard.model";
import {forkJoin} from "rxjs";
import {finalize} from "rxjs/operators";
import {I18NService} from "@core";

@Component({
    standalone: false,
    selector: 'app-create-instance',
    templateUrl: './create-instance.component.html',
    styleUrls: ['./create-instance.component.less']
})
export class CreateInstanceComponent implements OnInit, OnDestroy {

    @Input() flow: FlowConfig;

    @Input() erupt: string;

    @Input() onClose: () => void;

    @Output() close = new EventEmitter();

    startNode: StartNode;

    loading: boolean = false;

    submitting: boolean = false;

    eruptBuild: EruptBuildModel;

    selfSelectNodes: KV<string, string>[] = [];

    nodeUsersOptions: { [key: string]: EruptUser[] } = {};

    selectedNodeUserIds: { [key: string]: number[] } = {};

    constructor(private msg: NzMessageService,
                private dataHandlerService: DataHandlerService,
                private cdr: ChangeDetectorRef,
                @Inject(NzDrawerService)
                private drawerService: NzDrawerService,
                private flowApiService: FlowApiService,
                private flowInstanceApiService: FlowInstanceApiService,
                private i18n: I18NService) {

    }

    ngOnInit() {
        this.loading = true;
        this.cdr.detectChanges();
        if (this.erupt) {
            forkJoin([
                this.flowApiService.eruptFlowBuild(this.erupt),
                this.flowApiService.selfSelectNodes(this.flow.id)
            ]).subscribe({
                next: ([eruptBuildRes, nodeRes]) => {
                    this.dataHandlerService.initErupt(eruptBuildRes.data);
                    eruptBuildRes.data.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
                    this.eruptBuild = eruptBuildRes.data;
                    this.selfSelectNodes = nodeRes.data;

                    if (this.selfSelectNodes.length > 0) {
                        const nodeUserTasks = this.selfSelectNodes.map(node =>
                            this.flowApiService.selfSelectNodeUsers(this.flow.id, node.key)
                        );
                        forkJoin(nodeUserTasks).subscribe({
                            next: (userResults) => {
                                userResults.forEach((userRes, index) => {
                                    this.nodeUsersOptions[this.selfSelectNodes[index].key] = userRes.data;
                                });
                            },
                            complete: () => {
                                this.loading = false;
                                this.cdr.detectChanges();
                            },
                            error: () => {
                                this.loading = false;
                                this.cdr.detectChanges();
                            }
                        });
                    } else {
                        this.loading = false;
                        this.cdr.detectChanges();
                    }
                },
                error: () => {
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
            this.startNode = this.flow.rule[0].prop;
        }
    }

    ngOnDestroy() {
    }

    onViewFlow() {
        openResizableDrawer(this.drawerService, {
            nzTitle: this.i18n.fanyi('flow.action.view_flow'),
            nzContent: EruptFlowComponent,
            nzContentParams: {
                eruptBuild: this.eruptBuild,
                modelValue: this.flow.rule,
                readonly: true
            },
            nzBodyStyle: {
                padding: '0',
                background: 'rgb(245 245 245)'
            },
            nzPlacement: 'bottom',
            nzHeight: '85%',
            nzFooter: null
        }, "flow-view")
    }

    onSubmit(): void {
        if (this.submitting) {
            return;
        }
        for (let node of this.selfSelectNodes) {
            if (!this.selectedNodeUserIds[node.key] || this.selectedNodeUserIds[node.key].length == 0) {
                this.msg.warning(this.i18n.fanyi('flow.warning.select_approver_prefix') + node.value + this.i18n.fanyi('flow.warning.select_approver_suffix'));
                return;
            }
        }
        let selfSelectNodeUsers = {};
        for (let key in this.selectedNodeUserIds) {
            selfSelectNodeUsers[key] = this.selectedNodeUserIds[key];
        }
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.submitting = true;
        this.flowInstanceApiService.create(this.flow.id, {
            data: data,
            selfSelectNodeUsers: selfSelectNodeUsers
        }).pipe(finalize(() => {
            this.submitting = false;
            this.cdr.markForCheck();
        })).subscribe(res => {
            if (res.success) {
                this.msg.success(this.i18n.fanyi('flow.success.start_approval'));
                this.close.emit();
                if (this.onClose) {
                    this.onClose();
                }
            }
        })
    }

    onCancel(): void {
        this.close.emit();
        if (this.onClose) {
            this.onClose();
        }
    }

}
