// One revision of a record, as returned by the erupt-revision module.
export interface RecordRevision {
    id: number;
    // 1-based, increasing per record
    version: number;
    operation: "ADD" | "UPDATE" | "DELETE";
    createTime: string;
    userId?: number;
    userName?: string;
    userAvatar?: string;
    changes: FieldChange[];
}

// One field of a revision; `before` is absent on an ADD, `after` on a DELETE
export interface FieldChange {
    field: string;
    // form title of the field at the time of the change
    title: string;
    before?: any;
    after?: any;
}
