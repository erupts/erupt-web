abstract class ANode {

    abstract type: string;

    abstract validate(): void;

    // 普通方法
    eat(): void {
        console.log('Animal is eating');
    }
}
