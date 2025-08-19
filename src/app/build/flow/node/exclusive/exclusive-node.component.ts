import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {BranchType, NodeRule, NodeType} from "@flow/model/node.model";
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
        console.log(this.branch, flex)
    }

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    override type(): NodeType {
        return NodeType.EXCLUSION;
    }

    override color(): string {
        return "#59B9A4";
    }

    override name(): string {
        return "互斥条件";
    }

    override create(): NodeRule {
        return {
            id: geneNodeId() + '_fork',
            type: NodeType.EXCLUSION,
            name: this.name(),
            branches: [
                this.createBranch(1),
                {
                    id: geneNodeId(),
                    type: NodeType.BRANCH,
                    name: '默认条件',
                    prop: {
                        type: BranchType.ELSE
                    },
                    branches: []
                }
            ]
        }
    }

    override onSaveProp(): void {
    }

    override createBranch(i?: number): NodeRule {
        return {
            id: geneNodeId(),
            type: NodeType.BRANCH,
            name: '条件' + i,
            prop: {
                type: BranchType.CONDITION
            },
            branches: []
        };
    }
}
