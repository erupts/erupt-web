import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {ApprovalStrategy, ApprovalTimeoutAction, ApproveNode, NobodyStrategy, ReviewMode} from "@flow/model/fllw-approval.model";
import {FlowTurn} from "@flow/model/flow-instance.model";
import {UpmsDataService} from "@flow/service/upms-data.service";

@Component({
    selector: 'app-approval-node',
    templateUrl: './approval-node.component.html',
    styleUrls: ['./approval-node.component.less']
})
export class ApprovalNodeComponent extends ANode implements OnInit {

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    @Input() progress: Record<string, FlowTurn>;

    approveNode: ApproveNode = new ApproveNode();

    selectTab: number = 0;

    constructor(protected upmsDataService?: UpmsDataService) {
        super();
    }


    ngOnInit(): void {
        if (this.modelValue.prop) {
            this.approveNode = this.modelValue.prop;
        }
    }

    addReviewUsers() {
        this.approveNode.reviewUserModes.push({
            mode: ReviewMode.SPECIFIED_USER,
            modeValue: null
        })
    }

    deleteReviewUser(index: number) {
        // 确保最少保留一个审批人
        if (this.approveNode.reviewUserModes.length > 1) {
            this.approveNode.reviewUserModes.splice(index, 1);
        }
    }

    override type(): NodeType {
        return NodeType.APPROVAL;
    }

    override name(): string {
        return "审批人";
    }

    override color(): string {
        return "#EC8151";
    }


    override onSelect() {
        // this.select.emit(this.modelValue);
    }

    override onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    override onInsertNode(type: NodeType) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    override create(): any {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
            prop: new ApproveNode()
        };
    }

    override onSaveProp(): void {
        this.modelValue.prop = this.approveNode;
    }

    protected readonly ApprovalStrategy = ApprovalStrategy;

    protected readonly NobodyStrategy = NobodyStrategy;

    protected readonly ApprovalTimeoutAction = ApprovalTimeoutAction;
}
