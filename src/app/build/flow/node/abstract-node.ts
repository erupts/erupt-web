import {NodeRule, NodeType} from "@flow/model/node.model";

export abstract class ANode {

    abstract type(): NodeType;

    abstract name(): string;

    abstract color(): string;

    abstract onSelect(): void;

    abstract create(): NodeRule;
    createBranch(i?: number): NodeRule {
        throw new Error('Method not implemented.');
    }


}
