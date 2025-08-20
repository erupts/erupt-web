import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

@Component({
    selector: 'app-cc-node',
    templateUrl: './cc-node.component.html',
    styleUrls: ['./cc-node.component.less']
})
export class CcNodeComponent extends ANode {
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
        return NodeType.CC;
    }

    override color(): string {
        return "#5994F3";
    }

    override name(): string {
        return "抄送人";
    }

    override create(): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
        }
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    override onSaveProp(): void {
    }
}
