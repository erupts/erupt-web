import {Component, Input} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {geneNodeId} from "@flow/util/flow-util";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";

@Component({
    selector: 'app-system-node',
    templateUrl: './flex-node.component.html',
    styleUrls: ['./flex-node.component.less']
})
export class FlexNodeComponent extends ANode {

    @Input() eruptBuild: EruptBuildModel;

    color(): string {
        return "#09f";
    }

    create(): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name()
        };
    }

    name(): string {
        return "Flex";
    }

    onSelect(): void {
    }

    type(): NodeType {
        return NodeType.FlEX;
    }

}
