import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId} from "@flow/util/flow-util";
import {NodeRule, NodeType} from "@flow/model/node.model";

@Component({
    selector: 'app-approval-node',
    templateUrl: './approval-node.component.html',
    styleUrls: ['./approval-node.component.less']
})
export class ApprovalNodeComponent extends ANode {

    @Input() readonly = false;
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
