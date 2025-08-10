import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

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

    showErr = false;
    errInfo: any = null;


    type(): NodeType {
        return NodeType.APPROVAL;
    }

    name(): string {
        return "审批人";
    }

    color(): string {
        return "#EC8151";
    }


    onSelect() {
        // this.select.emit(this.modelValue);
    }

    onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    onInsertNode(type: string) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    onInsertFlexNode(flex: FlexNodeModel) {
        this.branch.splice(this.index + 1, 0, {
            id: geneNodeId(),
            type: NodeType.FlEX,
            flex: flex.code,
            name: flex.name,
            color: flex.color
        });
    }

    click(): void {
    }

    create(): any {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name()
        };
    }

}
