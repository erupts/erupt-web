// One comment on a record, as returned by the erupt-comment module.
export interface RecordComment {
    id: number;
    // top-level comment this one answers; absent on a thread head
    parentId?: number;
    content: string;
    createTime: string;
    userId?: number;
    userName?: string;
    userAvatar?: string;
    // written by the current user, so it may be deleted here
    mine: boolean;
}
