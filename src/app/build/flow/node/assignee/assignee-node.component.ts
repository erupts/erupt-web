import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {ApprovalStrategy, AssigneeNode, CcNode, ReviewMode} from "@flow/model/flow-approval.model";
import {FlowTurn} from "@flow/model/flow-instance.model";

@Component({
    standalone: false,
    selector: 'assignee-node',
    templateUrl: './assignee-node.component.html',
    styleUrls: ['./assignee-node.component.less']
})
export class AssigneeNodeComponent extends ANode implements OnInit {

    @Input() flowRule: NodeRule[];
    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() progress: Record<string, FlowTurn>;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    selectTab: number = 0;

    assigneeNode: AssigneeNode = new AssigneeNode();


    ngOnInit(): void {
        if (this.modelValue.prop) {
            this.assigneeNode = this.modelValue.prop;
        }
    }

    deleteReviewUser(index: number) {
        // 确保最少保留一个审批人
        if (this.assigneeNode.reviewUserModes.length > 1) {
            this.assigneeNode.reviewUserModes.splice(index, 1);
        }
    }

    addReviewUsers() {
        this.assigneeNode.reviewUserModes.push({
            mode: ReviewMode.SPECIFIED_USER,
            modeValue: null
        })
    }

    override onSelect() {
        this.select.emit(this.modelValue);
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

    override type(): NodeType {
        return NodeType.ASSIGNEE;
    }

    override color(): string {
        return "#b85c38";
    }

    override name(): string {
        return "办理人";
    }

    override create(): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
            prop: new CcNode()
        }
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    override onSaveProp(): void {
        this.modelValue.prop = this.assigneeNode;
    }

    protected readonly ApprovalStrategy = ApprovalStrategy;
}
