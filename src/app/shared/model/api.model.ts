export interface R<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface SimplePage<T> {
    list: T[],
    total: number;
}
