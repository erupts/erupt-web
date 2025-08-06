import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {geneNodeId} from "@flow/util/flow-util";

@Component({
    selector: 'app-start-node',
    templateUrl: './start-node.component.html',
    styleUrls: ['./start-node.component.less']
})
export class StartNodeComponent extends ANode {
    @Input() readonly = false;
    @Input() model: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    showErr = false;
    errInfo: any = null;

    onSelect() {
        this.select.emit(this.model);
    }

    onInsertNode(type: string) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    type(): NodeType {
        return NodeType.START;
    }

    color(): string {
        return "#80929C";
    }

    name(): string {
        return "发起人";
    }

    create(): any {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
        }
    }

}
