import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {ApprovalStrategy, AssigneeNode, CcNode, ReviewMode} from "@flow/model/flow-approval.model";
import {FlowTurn} from "@flow/model/flow-instance.model";
import {I18NService} from "@core";

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
        // Ensure at least one approver is retained
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

    constructor(private i18n?: I18NService) {
        super();
    }

    get assigneeTabOptions() {
        return [
            {value: 0, label: this.i18n.fanyi('flow.node.tab.set_assignee')},
            {value: 1, label: this.i18n.fanyi('flow.node.tab.form_access')},
        ];
    }

    override name(): string {
        return I18NService.instance?.fanyi('flow.node.assignee_label');
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
    protected readonly NodeType = NodeType;
}
