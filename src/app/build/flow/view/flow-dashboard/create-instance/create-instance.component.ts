import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormSize} from "../../../../erupt/model/erupt.enum";
import {FlowApiService} from "@flow/service/flow-api.service";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {FlowConfig} from "@flow/model/flow.model";
import {DataHandlerService} from "../../../../erupt/service/data-handler.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {EruptFlowComponent} from "@flow/components/erupt-flow/erupt-flow.component";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {StartNode} from "@flow/model/flow-approval.model";

@Component({
    standalone: false,
    selector: 'app-create-instance',
    templateUrl: './create-instance.component.html',
    styleUrls: ['./create-instance.component.less']
})
export class CreateInstanceComponent implements OnInit {

    @Input() flow: FlowConfig;

    @Input() erupt: string;

    @Input() onClose: () => void;

    @Output() close = new EventEmitter();

    startNode: StartNode;

    loading: boolean = false;

    eruptBuild: EruptBuildModel;

    constructor(private msg: NzMessageService,
                @Inject(NzModalService)
                private modal: NzModalService,
                private dataHandlerService: DataHandlerService,
                @Inject(NzDrawerService)
                private drawerService: NzDrawerService,
                private flowApiService: FlowApiService,
                private flowInstanceApiService: FlowInstanceApiService) {

    }

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
