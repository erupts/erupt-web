import {Component, OnInit, ViewChild} from '@angular/core';
import {ApprovalView, FlowInstance} from "@flow/model/flow-instance.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {NodeType} from "@flow/model/node.model";
import {getAvatarColor} from "@flow/util/flow.util";
import {FlowApprovalDetailComponent} from "@flow/view/flow-approval-detail/flow-approval-detail.component";
import {SettingsService} from "@delon/theme";


@Component({
    selector: 'app-flow-approval',
    templateUrl: './flow-approval.component.html',
    styleUrls: ['./flow-approval.component.less']
})
export class FlowApprovalComponent implements OnInit {

    selectedView: ApprovalView = ApprovalView.TODO;

    flowInstances: FlowInstance[] = [];

    selectedInstance: FlowInstance;

    todoCount: number = 0

    selectFlow: number = null;


    @ViewChild(FlowApprovalDetailComponent) private approvalDetail!: FlowApprovalDetailComponent;

    constructor(
        public settingSrv: SettingsService,
        private flowInstanceApiService: FlowInstanceApiService,
    ) {
    }

    ngOnInit() {
        this.loadFlows(ApprovalView.TODO);
    }


    uniqFlowInstances = (arr: FlowInstance[]) => [
        ...new Map(arr.map(item => [item.eruptFlowConfig.id, item])).values()
    ];

    selectInstance(flow: FlowInstance) {
        this.selectedInstance = flow;
        this.approvalDetail.onSelectFlow(this.selectedView, this.selectedInstance);
        // if (flow?.id) {
        //     this.loadInstanceDetail(flow);
        // }
    }

    onSelectFlow(flow: number) {
        this.loadFlows(this.selectedView, flow);
    }

    loadFlows(view: ApprovalView, flowId: number = null, selectFirst: boolean = true) {
        this.selectedView = view;
        this.selectFlow = flowId;
        this.selectedInstance = null;
        this.flowInstanceApiService.list({
            approvalView: this.selectedView,
            flowId
        }).subscribe({
            next: (data) => {
                this.flowInstances = data.data;
                if (selectFirst) {
                    this.selectedInstance = this.flowInstances[0] || null;
                    this.selectInstance(this.selectedInstance);
                }
                if (this.selectedView == ApprovalView.TODO) {
                    this.todoCount = this.flowInstances.length;
                }
            }
        });
    }

    reloadFlows() {
        this.loadFlows(this.selectedView, null, true);
    }

    protected readonly ApprovalView = ApprovalView;

    protected readonly NodeType = NodeType;

    protected readonly getAvatarColor = getAvatarColor;

    protected readonly JSON = JSON;
}
