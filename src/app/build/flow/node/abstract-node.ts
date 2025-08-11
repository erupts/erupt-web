import {NodeRule, NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

export abstract class ANode {

    abstract type(): NodeType;

    abstract name(): string;

    abstract color(): string;

    abstract onSelect(): void;

    abstract create(): NodeRule;

    abstract onInsertFlexNode(flex: FlexNodeModel): void;

    abstract onInsertNode(type: string): void;

    abstract onDelete(): void;

    createBranch(i?: number): NodeRule {
        throw new Error('Method not implemented.');
    }


}
