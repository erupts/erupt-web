export interface Chat {
    id: number;
    title: string;
}

export interface ChatMessage {
    id: number;
    senderType: 'USER' | 'MODEL';
    content: string;
    /** API 加载的历史消息 call 块内容 */
    think?: string;
    /** 流式结束后可能已为 HTML，避免再次 md.render */
    contentHtml?: string;
    createTime: string;
    loading: boolean;
    chatId?: number;
    /** 流式输出每更新一次自增，用于触发打字动画（非 parts 消息专用） */
    streamingTick?: number;
    /** 已完成的代码块冻结 HTML 片段（非 parts 消息专用） */
    frozenSegments?: string[];
    /** 是否正在渲染中（针对异步懒加载 render） */
    rendering?: boolean;
    /** 消息操作状态 */
    copied?: boolean;
    speaking?: boolean;
}

export interface UserInfo {
    nickname: string;
}

export interface Agent {
    id: number;
    name: string;
    desc: string;
    hints: string[]
}

export interface SseMessage {
    event: SseMessageEvent;
    data: any;
}

export enum SseMessageEvent {
    CALL = "CALL",
    TOKEN = "TOKEN",
    DONE = "DONE"
}
