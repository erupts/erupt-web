export interface Chat {
    id: number;
    title: string;
}

export interface ChatMessage {
    id: number;
    senderType: 'USER' | 'MODEL';
    content: string;
    /** 流式结束后可能已为 HTML，避免再次 md.render */
    contentHtml?: string;
    createTime: string;
    loading: boolean;
    chatId?: number;
    /** 流式输出每更新一次自增，用于触发打字动画 */
    streamingTick?: number;
}

export interface UserInfo {
    nickname: string;
}

export interface Agent {
    id: number;
    name: string;
    desc: string;
}
