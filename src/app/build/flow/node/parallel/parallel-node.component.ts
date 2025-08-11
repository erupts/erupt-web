import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

@Component({
    selector: 'app-parallel-node',
    templateUrl: './parallel-node.component.html',
    styleUrls: ['./parallel-node.component.less']
})
export class ParallelNodeComponent extends ANode {
    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
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

    override onSelect() {
        this.select.emit(this.modelValue);
    }

    override onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    override onInsertNode(type: string) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, -1, flex);
    }

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    override type(): NodeType {
        return NodeType.PARALLEL;
    }

    override color(): string {
        return "#718dff";
    }

    override name(): string {
        return "并行分支";
    }

    override create(): NodeRule {
        return {
            id: geneNodeId() + '_fork',
            type: this.type(),
            name: this.name(),
            branches: [
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
            branches: []
        };
    }

    override onSaveProp(): void {
    }
}
