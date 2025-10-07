import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

@Component({
    selector: 'app-start-node',
    templateUrl: './start-node.component.html',
    styleUrls: ['./start-node.component.less']
})
export class StartNodeComponent extends ANode {
    @Input() readonly = false;
    @Input() model: NodeRule;
    @Input() eruptBuild: EruptBuildModel;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    override onSelect() {
        this.select.emit(this.model);
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


    override type(): NodeType {
        return NodeType.START;
    }

    override color(): string {
        return "#80929C";
    }

    override name(): string {
        return "发起人";
    }

    override create(): any {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
        }
    }

    override onDelete(): void {
    }

    override onSaveProp(): void {
    }

}
