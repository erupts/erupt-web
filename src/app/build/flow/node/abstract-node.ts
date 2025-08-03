export abstract class ANode {

    abstract type(): string;

    abstract name(): string;

    abstract color(): string;

    abstract onSelect(): void;

    abstract create(): any;

    createBranch(i?: number) {
        throw new Error('Method not implemented.');
    }


}
