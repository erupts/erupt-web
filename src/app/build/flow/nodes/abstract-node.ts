abstract class ANode {

    abstract code: string;

    abstract color: string;

    abstract click(): void;

    eat(): void {
        console.log('Animal is eating');
    }
}
