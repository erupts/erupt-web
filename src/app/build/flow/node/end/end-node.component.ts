import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {geneNodeId} from "@flow/util/flow.util";
import {FlowTurn} from "@flow/model/flow-instance.model";

@Component({
    standalone: false,
  selector: 'app-end-node',
  templateUrl: './end-node.component.html',
  styleUrls: ['./end-node.component.less']
})
export class EndNodeComponent extends ANode {

    @Input() progress: Record<string, FlowTurn>;

    @Input() model: NodeRule;

    @Output() modelChange = new EventEmitter<any>();

    override onSelect() {

    }

    override onInsertNode(type: NodeType) {

    }

    override onInsertFlexNode(flex: FlexNodeModel) {

    }


    override type(): NodeType {
        return NodeType.END;
    }

    override color(): string {
        return "#80929C";
    }

    override name(): string {
        return "END";
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
