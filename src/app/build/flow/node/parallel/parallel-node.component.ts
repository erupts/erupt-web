import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId} from "@flow/util/flow-util";
import {NodeRule, NodeType} from "@flow/model/node.model";

@Component({
    selector: 'app-parallel-node',
    templateUrl: './parallel-node.component.html',
    styleUrls: ['./parallel-node.component.less']
})
export class ParallelNodeComponent extends ANode {
    @Input() readonly = false;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() moveLn = false;
    @Input() isDefault = false;
    @Input() moveRn = false;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

    validate(err: any[]) {
        return true;
    }

    onSelect() {
        this.select.emit(this.modelValue);
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

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    type(): string {
        return NodeType.PARALLEL;
    }

    color(): string {
        return "#718dff";
    }

    name(): string {
        return "并行分支";
    }

    create() {
        return {
            id: geneNodeId() + '_fork',
            type: this.type(),
            name: this.name(),
            branch: [
                this.createBranch(1),
                this.createBranch(2)
            ]
        }
    }

    override createBranch(i?: number): NodeRule {
        return {
            id: geneNodeId(),
            type: NodeType.BRANCH,
            name: '并行路径' + i,
            branch: []
        };
    }
}
