import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId} from "@flow/util/flow-util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

@Component({
    selector: 'app-exclusive-node',
    templateUrl: './exclusive-node.component.html',
    styleUrls: ['./exclusive-node.component.less']
})
export class ExclusiveNodeComponent extends ANode {

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() moveLn = false;
    @Input() moveRn = false;
    @Input() isDefault = false;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

    showErr = false;
    errInfo: any = null;

    onSelect() {
        this.select.emit(this.modelValue);
    }

    onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    onInsertFlexNode(flex: FlexNodeModel) {
        console.log(flex);
        this.branch.splice(this.index + 1, 0, {
            id: geneNodeId(),
            type: NodeType.FlEX,
            flex: flex.code,
            name: flex.name,
            color: flex.color
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

    type(): NodeType {
        return NodeType.EXCLUSION;
    }

    color(): string {
        return "#59B9A4";
    }

    name(): string {
        return "互斥条件";
    }

    create(): NodeRule {
        return {
            id: geneNodeId() + '_fork',
            type: NodeType.EXCLUSION,
            name: this.name(),
            branches: [
                this.createBranch(1),
                {
                    id: geneNodeId(),
                    type: NodeType.ELSE,
                    name: '默认条件',
                    branches: []
                }
            ]
        }
    }

    override createBranch(i?: number): NodeRule {
        return {
            id: geneNodeId(),
            type: NodeType.IF,
            name: '条件' + i,
            branches: []
        };
    }
}
