import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {ApprovalMode, ApprovalStrategy, ApproveNode} from "@flow/model/fllw-approval.model";

@Component({
    selector: 'app-approval-node',
    templateUrl: './approval-node.component.html',
    styleUrls: ['./approval-node.component.less']
})
export class ApprovalNodeComponent extends ANode {

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    approveNode: ApproveNode = new ApproveNode();

    showErr = false;
    errInfo: any = null;

    selectTab: number = 1;

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
            name: this.name()
        };
    }

    override onSaveProp(): void {
    }

    protected readonly ApprovalMode = ApprovalMode;

    protected readonly ApprovalStrategy = ApprovalStrategy;

}
