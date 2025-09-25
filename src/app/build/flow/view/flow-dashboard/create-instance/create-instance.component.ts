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

@Component({
    selector: 'app-create-instance',
    templateUrl: './create-instance.component.html',
    styleUrls: ['./create-instance.component.less']
})
export class CreateInstanceComponent implements OnInit {

    @Input() flow: FlowConfig;

    @Input() erupt: string;

    @Input() onClose: () => void;

    @Output() close = new EventEmitter();

    loading: boolean = false;

    eruptBuild: EruptBuildModel;

    constructor(private flowApiService: FlowApiService,
                private msg: NzMessageService,
                @Inject(NzModalService)
                private modal: NzModalService,
                private dataHandlerService: DataHandlerService,
                @Inject(NzDrawerService)
                private drawerService: NzDrawerService,
                private flowInstanceApiService: FlowInstanceApiService) {

    }

    ngOnInit(): void {
        this.loading = true;
        if (this.erupt) {
            this.flowApiService.eruptFlowBuild(this.erupt).subscribe(res => {
                res.data.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
                this.dataHandlerService.initErupt(res.data)
                this.eruptBuild = res.data;
                this.loading = false;
            })
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

    /**
     * 发起流程
     */
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

    /**
     * 取消操作
     */
    onCancel(): void {
        this.close.emit();
        if (this.onClose) {
            this.onClose();
        }
    }

}
