import {AfterViewChecked, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {ChatApiService} from '../../service/chat-api.service';
import {MarkdownService} from '../../service/markdown.service';
import {Agent, Chat, ChatMessage, UserInfo} from '../../model/chat.model';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';
import {RestPath} from "../../../erupt/model/erupt.enum";

/** 会话列表每页条数 */
const CHAT_PAGE_SIZE = 20;
/** 距底部多少 px 时触发加载更多会话 */
const CHAT_SCROLL_THRESHOLD = 80;

@Component({
    standalone: false,
    selector: 'app-ai-chat',
    templateUrl: './ai-chat.component.html',
    styleUrls: ['./ai-chat.component.less']
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('bubblesRef') bubblesRef!: ElementRef<HTMLDivElement>;
    @ViewChild('chatListRef') chatListRef!: ElementRef<HTMLUListElement>;

    userInfo: UserInfo | null = null;
    chats: Chat[] = [];
    agents: Agent[] = [];
    messages: ChatMessage[] = [];
    selectChat: number | null = null;
    /** 选中的智能体 id，用于下拉绑定；发送时用 get selectAgent() 取完整对象 */
    selectAgentId: number | null = null;
    content = '';
    sending = false;
    sendDisabled = false;
    messagePage = 1;
    loadingMoreMessages = false;
    hasMoreMessages = true;
    accumulatedMarkdown = '';
    /** 会话列表分页：当前页（从 1 开始） */
    chatPage = 1;
    /** 是否还有更多会话 */
    hasMoreChats = true;
    /** 是否正在加载更多会话 */
    loadingMoreChats = false;
    /** 是否正在加载会话列表（首屏） */
    loadingChats = false;
    /** 是否正在加载消息列表（选中会话后的首屏消息） */
    loadingMessages = false;
    /** 是否全屏模式 */
    fullscreen = false;
    private eventSource: EventSource | null = null;
    private llmId = '';

    constructor(
        private chatApi: ChatApiService,
        private markdown: MarkdownService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private modal: NzModalService,
        private message: NzMessageService
    ) {
        const params = new URLSearchParams(window.location.search);
        this.llmId = params.get('llm') || '';
    }

    ngOnInit(): void {
        this.chatApi.userInfo().subscribe(res => {
            this.userInfo = res as UserInfo;
        });
        this.fetchChats();
        this.chatApi.agents().subscribe(res => {
            this.agents = res.data;
        });
    }

    ngOnDestroy(): void {
        this.closeEventSource();
    }

    ngAfterViewChecked(): void {
        const el = this.bubblesRef?.nativeElement;
        if (el) this.markdown.runMermaid(el);
    }

    private closeEventSource(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    createConversation(): void {
        this.messages = [];
        this.selectChat = null;
        this.sending = false;
        this.sendDisabled = false;
    }

    /** 拉取会话列表：reset 为 true 时从第一页重新拉取并选中第一项 */
    fetchChats(reset = true, after?: () => void): void {
        if (reset) {
            this.chatPage = 1;
            this.hasMoreChats = true;
            this.loadingChats = true;
        }
        const page = this.chatPage;
        const size = CHAT_PAGE_SIZE;
        this.chatApi.chats(page, size).subscribe({
            next: res => {
                const pageData = res.data;
                const list = pageData?.list ?? [];
                const total = pageData?.total ?? 0;
                if (reset) {
                    this.loadingChats = false;
                    this.chats = list;
                    if (list.length) {
                        this.selectChat = list[0].id;
                        this.onSelectChat(list[0].id, after);
                    } else {
                        this.clearStatus();
                        after?.();
                    }
                } else {
                    this.chats = this.chats.concat(list);
                }
                this.hasMoreChats = this.chats.length < total;
                if (!reset) {
                    after?.();
                }
            },
            error: () => {
                if (reset) {
                    this.loadingChats = false;
                    this.chats = [];
                    this.clearStatus();
                }
                after?.();
            }
        });
    }

    /** 会话列表滚动：到底部时加载下一页 */
    onChatListScroll(): void {
        if (this.loadingMoreChats || !this.hasMoreChats) return;
        const el = this.chatListRef?.nativeElement;
        if (!el) return;
        const {scrollTop, scrollHeight, clientHeight} = el;
        if (scrollTop + clientHeight >= scrollHeight - CHAT_SCROLL_THRESHOLD) {
            this.loadingMoreChats = true;
            this.chatPage += 1;
            this.chatApi.chats(this.chatPage, CHAT_PAGE_SIZE).subscribe({
                next: res => {
                    const pageData = res.data;
                    const list = pageData?.list ?? [];
                    const total = pageData?.total ?? 0;
                    this.chats = this.chats.concat(list);
                    this.hasMoreChats = this.chats.length < total;
                },
                complete: () => {
                    this.loadingMoreChats = false;
                }
            });
        }
    }

    clearStatus(): void {
        this.selectChat = null;
        this.sending = false;
        this.sendDisabled = false;
        this.messagePage = 1;
        this.hasMoreMessages = true;
        this.accumulatedMarkdown = '';
        this.messages = [];
    }

    onSelectChat(chatId: number, after?: () => void): void {
        this.clearStatus();
        this.selectChat = chatId;
        this.fetchMessages(chatId, true, after);
    }

    fetchMessages(chatId: number, toBottom: boolean, after?: () => void): void {
        const isFirstPage = this.messagePage === 1;
        if (isFirstPage) this.loadingMessages = true;
        this.loadingMoreMessages = true;
        this.chatApi.messages(chatId, 20, this.messagePage).subscribe({
            next: res => {
                const list = (res.data || []).slice().reverse();
                if (isFirstPage) {
                    this.messages = list;
                    this.loadingMessages = false;
                } else {
                    this.messages = list.concat(this.messages);
                }
                this.hasMoreMessages = (res.data?.length ?? 0) === 20;
                after?.();
                if (toBottom) {
                    setTimeout(() => this.scrollBubblesToBottom(), 100);
                }
            },
            error: err => {
                if (isFirstPage) this.loadingMessages = false;
                const msg = err?.message || err?.data || String(err);
                this.messages.push({
                    content: msg,
                    senderType: 'MODEL',
                    id: 0,
                    createTime: '',
                    loading: false
                });
            },
            complete: () => {
                this.loadingMoreMessages = false;
            }
        });
    }

    send(message: string): void {
        if (!message?.trim()) return;
        const doStart = (chatId: number) => {
            this.sending = true;
            this.content = '';
            this.messages.push({
                id: Math.random(),
                senderType: 'USER',
                content: message,
                createTime: '',
                loading: false
            } as ChatMessage);
            this.messages.push({
                id: Math.random(),
                senderType: 'MODEL',
                content: '',
                createTime: '',
                loading: true
            } as ChatMessage);
            setTimeout(() => this.scrollBubblesToBottom(), 10);

            const token = this.tokenService.get()?.token || '';
            const url = RestPath.erupt + `/ai/chat/send?chatId=${chatId}&message=${encodeURIComponent(message)}&_token=${encodeURIComponent(token)}&agentId=${this.selectAgentId ?? ''}&llmId=${this.llmId}`;
            this.closeEventSource();
            this.eventSource = new EventSource(url);

            this.eventSource.onmessage = (event) => {
                this.sending = false;
                this.sendDisabled = true;
                try {
                    const data = JSON.parse(event.data);
                    this.accumulatedMarkdown += data.text || '';
                } catch {
                    this.accumulatedMarkdown += event.data;
                }
                const last = this.messages[this.messages.length - 1];
                if (last?.loading) last.loading = false;
                setTimeout(() => {
                    if (last) {
                        last.contentHtml = this.markdown.render(this.accumulatedMarkdown);
                        last.content = this.accumulatedMarkdown;
                    }
                    this.messageToBottom();
                    setTimeout(() => this.messageToBottom(), 50);
                }, 10);
            };

            this.eventSource.onerror = () => {
                setTimeout(() => {
                    this.accumulatedMarkdown = '';
                    this.sendDisabled = false;
                    this.sending = false;
                    this.closeEventSource();
                }, 100);
            };

            this.eventSource.onopen = () => {
                this.sendDisabled = true;
            };
        };

        if (this.selectChat == null) {
            this.chatApi.createChat(message).subscribe({
                next: res => {
                    this.fetchChats(true, () => doStart(res.data));
                }
            });
        } else {
            doStart(this.selectChat);
        }
    }

    /** 模型消息展示用 HTML：优先 contentHtml（流式已渲染），否则将 content 当 Markdown 渲染 */
    getMessageHtml(item: ChatMessage): string {
        if (item.senderType === 'USER') {
            return this.escapeHtml(item.content);
        }
        if (item.contentHtml) return item.contentHtml;
        if (!item.content) return '';
        return this.markdown.render(item.content);
    }

    private escapeHtml(s: string): string {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    messageToBottom(): void {
        const el = this.bubblesRef?.nativeElement;
        if (!el) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < el.clientHeight / 3) {
            el.scrollTop = el.scrollHeight;
        }
    }

    scrollBubblesToBottom(): void {
        const el = this.bubblesRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }

    deleteChat(chatId: number): void {
        this.modal.confirm({
            nzTitle: '确认删除',
            nzContent: '确定要删除该会话吗？删除后无法恢复。',
            nzOkText: '确定',
            nzOkDanger: true,
            nzCancelText: '取消',
            nzOnOk: () =>
                new Promise<void>((resolve, reject) => {
                    this.chatApi.deleteChat(chatId).subscribe({
                        next: () => {
                            this.fetchChats();
                            this.message.success('已删除');
                            resolve();
                        },
                        error: err => reject(err)
                    });
                })
        });
    }

    onBubbleScroll(): void {
        const el = this.bubblesRef?.nativeElement;
        if (!el || this.loadingMoreMessages || !this.hasMoreMessages || this.selectChat == null) return;
        if (el.scrollTop <= 10) {
            this.messagePage += 1;
            this.fetchMessages(this.selectChat, false);
        }
    }

    /** 输入框按键：Enter 发送，Shift+Enter 换行 */
    onInputKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.sendDisabled && this.content?.trim()) {
                this.send(this.content);
                this.content = '';
            }
        }
    }

    getUserAvatarLabel(item: ChatMessage): string {
        if (item.senderType === 'MODEL') return '';
        return this.userInfo?.nickname?.substring(0, 1) || 'U';
    }

    /** 切换全屏：主区域铺满视口并隐藏侧边栏 */
    toggleFullscreen(): void {
        this.fullscreen = !this.fullscreen;
    }
}
