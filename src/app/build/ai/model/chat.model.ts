export interface Chat {
    id: number;
    title: string;
}

export interface ChatMessage {
    id: number;
    senderType: 'USER' | 'MODEL';
    content: string;
    /** Content of the call block from API-loaded historical messages */
    think?: string;
    /** May already be HTML after streaming ends, to avoid calling md.render again */
    contentHtml?: string;
    createdAt?: string;
    loading: boolean;
    chatId?: number;
    /** Incremented on each streaming update to trigger the typing animation (not for parts messages) */
    streamingTick?: number;
    /** Frozen HTML fragments of completed code blocks (not for parts messages) */
    frozenSegments?: string[];
    /** Whether the message is currently being rendered (for async lazy-load render) */
    rendering?: boolean;
    /** Message action state */
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
