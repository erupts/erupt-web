import {NodeRule} from "@flow/model/node.model";

export abstract class ANode {

    abstract type(): string;

    abstract name(): string;

    abstract color(): string;

    abstract onSelect(): void;

    abstract create(): any;
    createBranch(i?: number): NodeRule {
        throw new Error('Method not implemented.');
    }


}
