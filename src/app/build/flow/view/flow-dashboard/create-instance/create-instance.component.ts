import {Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
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

    private resizing = false;
    private startX = 0;
    private startWidth = 0;
    private animationId: number | null = null;
    private drawerElement: HTMLElement | null = null;

    constructor(private msg: NzMessageService,
                private dataHandlerService: DataHandlerService,
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

        // 查找抽屉的容器 DOM 元素
        if (!this.drawerElement) {
            let parent = this.el.nativeElement.parentElement;
            while (parent && !parent.classList.contains('ant-drawer-content-wrapper')) {
                parent = parent.parentElement;
            }
            this.drawerElement = parent;
        }

        this.ngZone.runOutsideAngular(() => {
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
        });
        event.preventDefault();
    }

    private onMouseMove = (event: MouseEvent) => {
        if (!this.resizing) return;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animationId = requestAnimationFrame(() => {
            const offset = this.startX - event.clientX;
            const newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startWidth + offset));
            if (this.drawerElement) {
                this.drawerElement.style.width = `${newWidth}px`;
            }
        });
    };

    private onMouseUp = (event: MouseEvent) => {
        this.resizing = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        // 同步状态到 NzDrawerRef，确保 Angular 知晓最终宽度
        const offset = this.startX - event.clientX;
        const finalWidth = Math.max(300, Math.min(window.innerWidth * 0.9, this.startWidth + offset));
        this.ngZone.run(() => {
            this.drawerRef.nzWidth = `${finalWidth}px`;
        });
    };

    ngOnInit() {
        this.loading = true;
        if (this.erupt) {
            Promise.all([
                this.flowApiService.eruptFlowBuild(this.erupt),
            ]).then(([eruptBuild]) => {
                eruptBuild.subscribe(res => {
                    this.dataHandlerService.initErupt(res.data)
                    res.data.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
                    this.eruptBuild = res.data;
                });
                this.loading = false;
            })
            this.startNode = this.flow.rule[0].prop;
        }
    }

    ngOnDestroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
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
        let data = this.dataHandlerService.eruptValueToObject(this.eruptBuild);
        this.flowInstanceApiService.create(this.flow.id, data).subscribe(res => {
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
