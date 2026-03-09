import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
import {NzDrawerRef, NzDrawerService} from "ng-zorro-antd/drawer";
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

    eruptBuild: EruptBuildModel;

    selfSelectNodes: KV<string, string>[] = [];

    nodeUsersOptions: { [key: string]: EruptUser[] } = {};

    selectedNodeUserIds: { [key: string]: number[] } = {};

    private resizing = false;
    private startX = 0;
    private startWidth = 0;
    private drawerElement: HTMLElement | null = null;

    constructor(private msg: NzMessageService,
                private dataHandlerService: DataHandlerService,
                private cdr: ChangeDetectorRef,
                @Inject(NzDrawerService)
                private drawerService: NzDrawerService,
                private drawerRef: NzDrawerRef,
                private el: ElementRef,
                private ngZone: NgZone,
                private flowApiService: FlowApiService,
                private flowInstanceApiService: FlowInstanceApiService) {

    }

    onMouseDown(event: MouseEvent): void {
        this.resizing = true;
        this.startX = event.clientX;
        this.startWidth = parseInt(this.drawerRef.nzWidth as string) || 520;
        this.drawerElement = this.drawerElement || this.el.nativeElement.closest('.ant-drawer-content-wrapper');

        this.ngZone.runOutsideAngular(() => {
            const moveHandler = (moveEvent: MouseEvent) => {
                if (!this.resizing) return;
                const newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startX - moveEvent.clientX + this.startWidth));
                if (this.drawerElement) this.drawerElement.style.width = `${newWidth}px`;
            };
            const upHandler = (upEvent: MouseEvent) => {
                this.resizing = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                this.ngZone.run(() => this.drawerRef.nzWidth = this.drawerElement?.style.width);
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
        event.preventDefault();
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
        this.drawerService.create({
            nzTitle: '查看流程',
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
        })
    }

    onSubmit(): void {
        for (let node of this.selfSelectNodes) {
            if (!this.selectedNodeUserIds[node.key] || this.selectedNodeUserIds[node.key].length == 0) {
                this.msg.warning("请选择节点【" + node.value + "】的审批用户");
                return;
            }
        }
        let selfSelectNodeUsers = {};
        for (let key in this.selectedNodeUserIds) {
            selfSelectNodeUsers[key] = this.selectedNodeUserIds[key];
        }
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.flowInstanceApiService.create(this.flow.id, {
            data: data,
            selfSelectNodeUsers: selfSelectNodeUsers
        }).subscribe(res => {
            if (res.success) {
                this.msg.success("发起成功");
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
