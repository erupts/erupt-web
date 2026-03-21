import {Component, OnInit, ViewChild} from '@angular/core';
import {ApprovalView, FlowInstance} from "@flow/model/flow-instance.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";
import {NodeType} from "@flow/model/node.model";
import {getAvatarColor} from "@flow/util/flow.util";
import {FlowApprovalDetailComponent} from "@flow/view/flow-approval-detail/flow-approval-detail.component";
import {SettingsService} from "@delon/theme";


@Component({
    standalone: false,
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

    page: number = 0;

    size: number = 15;

    hasMore: boolean = true;

    loading: boolean = false;


    @ViewChild(FlowApprovalDetailComponent) private approvalDetail!: FlowApprovalDetailComponent;

    constructor(
        public settingSrv: SettingsService,
        private flowInstanceApiService: FlowInstanceApiService,
    ) {
    }

    ngOnInit() {
        this.page = 0;
        this.loadFlows(ApprovalView.TODO);
    }


    selectInstance(flow: FlowInstance) {
        this.selectedInstance = flow;
        this.approvalDetail.onSelectFlow(this.selectedView, this.selectedInstance);
        // if (flow?.id) {
        //     this.loadInstanceDetail(flow);
        // }
    }

    onSelectFlow(flow: number) {
        this.page = 0;
        this.hasMore = true;
        this.loadFlows(this.selectedView, flow);
    }

    loadFlows(view: ApprovalView, flowId: number = null, selectFirst: boolean = true) {
        if (this.loading) return;
        this.loading = true;
        if (this.selectedView != view || this.selectFlow != flowId) {
            this.page = 0;
            this.hasMore = true;
        }
        this.selectedView = view;
        this.selectFlow = flowId;
        if (this.page == 0) {
            this.selectedInstance = null;
        }
        this.flowInstanceApiService.list({
            approvalView: this.selectedView,
            flowId,
            page: this.page,
            size: this.size
        }).subscribe({
            next: (res) => {
                if (this.page == 0) {
                    this.flowInstances = res.data.list;
                } else {
                    this.flowInstances = [...this.flowInstances, ...res.data.list];
                }
                if (res.data.list.length < this.size) {
                    this.hasMore = false;
                }
                if (selectFirst && this.page == 0) {
                    this.selectedInstance = this.flowInstances[0] || null;
                    this.selectInstance(this.selectedInstance);
                }
                if (this.selectedView == ApprovalView.TODO && this.page == 0) {
                    this.todoCount = this.flowInstances.length;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadMore() {
        if (this.hasMore && !this.loading) {
            this.page++;
            this.loadFlows(this.selectedView, this.selectFlow, false);
        }
    }

    onScroll(event: any) {
        const element = event.target;
        if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
            this.loadMore();
        }
    }

    uniqFlowInstances(arr: FlowInstance[]) {
        return [
            ...new Map(arr.map(item => [item.eruptFlowConfig.id, item])).values()
        ];
    }

    reloadFlows() {
        this.page = 0;
        this.hasMore = true;
        this.loadFlows(this.selectedView, null, true);
    }

    protected readonly ApprovalView = ApprovalView;

    protected readonly NodeType = NodeType;

    protected readonly getAvatarColor = getAvatarColor;

    protected readonly JSON = JSON;
}
