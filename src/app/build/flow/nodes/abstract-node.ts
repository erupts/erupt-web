abstract class ANode {

    abstract code: string;

    abstract name: string;

    abstract color: string;

    abstract click(): void;

    eat(): void {
        console.log('Animal is eating');
    }
}
