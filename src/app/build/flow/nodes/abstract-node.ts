export abstract class ANode {

    abstract code(): string;

    abstract name(): string;

    abstract color(): string;

    abstract onSelect(): void;

}
