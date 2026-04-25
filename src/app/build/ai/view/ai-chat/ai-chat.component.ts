import {AfterViewChecked, Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {Subject} from 'rxjs';
import {throttleTime} from 'rxjs/operators';
import {ChatApiService} from '../../service/chat-api.service';
import {MarkdownService} from '../../service/markdown.service';
import {Agent, Chat, ChatMessage, SseMessage, SseMessageEvent} from '../../model/chat.model';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';
import {RestPath} from "../../../erupt/model/erupt.enum";
import {SettingsService} from "@delon/theme";
import {I18NService} from '@core';

/** 会话列表每页条数 */
const CHAT_PAGE_SIZE = 20;

/** 每个会话正在进行的 SSE 状态缓存 */
interface ChatSseState {
    eventSource: EventSource;
    /** 已累积的 markdown 文本 */
    accumulatedMarkdown: string;
    /** 正在流式写入的消息对象引用（始终保持最新内容，切换回来后直接追加到列表） */
    streamingMsg: ChatMessage;
    /** 已冻结的 markdown 末尾位置（accumulated 中最后一个完整代码块结束处） */
    frozenEndPos: number;
}
/** 距底部多少 px 时触发加载更多会话 */
const CHAT_SCROLL_THRESHOLD = 80;
/** 消息区视为「在底部」的缓冲 px：仅当用户在此范围内时，流式返回才自动触底 */
const BUBBLES_BOTTOM_BUFFER_PX = 300;

@Component({
    standalone: false,
    selector: 'app-ai-chat',
    templateUrl: './ai-chat.component.html',
    styleUrls: ['./ai-chat.component.less']
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('bubblesRef') bubblesRef!: ElementRef<HTMLDivElement>;
    @ViewChild('chatListRef') chatListRef!: ElementRef<HTMLUListElement>;
    @ViewChild('renameModalTpl') renameModalTpl!: TemplateRef<unknown>;
    @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

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
    /** 是否开启自动工具调用 */
    autoToolCall = true;
    /** 是否全屏模式 */
    fullscreen = false;
    /** 侧边栏是否收起 */
    sidebarCollapsed = localStorage.getItem('ai-chat-sidebar-collapsed') === '1';
    /** 是否显示「回到底部」按钮 */
    showScrollToBottom = false;
    /** 是否正在流式输出（用于显示文末光标，与 eventSource 同生命周期） */
    streaming = false;
    /** 重命名弹窗中的输入值 */
    renameTitle = '';
    /** 当前重命名操作的会话 id，在 nzOnOk 中使用 */
    private renameChatId: number | null = null;
    /** 各会话正在运行的 SSE 状态，key 为 chatId */
    private pendingSse = new Map<number, ChatSseState>();
    private llmId = '';
    private scrollSubject = new Subject<void>();
    private speakingMessage: ChatMessage | null = null;

    get selectedAgent(): Agent | undefined {
        return this.agents.find(a => a.id === this.selectAgentId);
    }

    constructor(
        protected settingsService: SettingsService,
        private chatApi: ChatApiService,
        private markdown: MarkdownService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private modal: NzModalService,
        private message: NzMessageService,
        private ngZone: NgZone,
        private route: ActivatedRoute,
        private i18n: I18NService
    ) {
        this.llmId = this.route.snapshot.queryParams['llm'] || '';
    }

    ngOnInit(): void {
        this.markdown.warmup();
        this.fetchChats();
        this.chatApi.agents().subscribe(res => {
            this.agents = res.data;
        });
        this.scrollSubject.pipe(throttleTime(50)).subscribe(() => {
            if (this.isBubblesNearBottom()) {
                this.scrollBubblesToBottom();
            }
        });
    }

    ngOnDestroy(): void {
        this.pendingSse.forEach(s => s.eventSource.close());
        this.pendingSse.clear();
        this.scrollSubject.complete();
        speechSynthesis.cancel();
    }

    ngAfterViewChecked(): void {
        if (this.streaming) return;
        const el = this.bubblesRef?.nativeElement;
        if (el) {
            const nodes = el.querySelectorAll('.mermaid:not([data-processed])');
            if (nodes.length > 0) {
                this.markdown.runMermaid(el).then();
            }
            const echartsNodes = el.querySelectorAll('.echarts-block:not([data-processed])');
            if (echartsNodes.length > 0) {
                this.markdown.runEcharts(el).then();
            }
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
        this.streaming = false;
        this.messagePage = 1;
        this.hasMoreMessages = true;
        this.messages = [];
    }

    onSelectChat(chatId: number, after?: () => void): void {
        // 重置 UI 状态（不关闭其他 chat 的 SSE）
        this.selectChat = chatId;
        this.sending = false;
        this.streaming = false;
        this.sendDisabled = false;
        this.messagePage = 1;
        this.hasMoreMessages = true;
        this.messages = [];

        // 始终从后端拉已持久化消息；拉完后若 SSE 仍在运行则追加流式消息
        this.fetchMessages(chatId, true, () => {
            const pending = this.pendingSse.get(chatId);
            if (pending) {
                // SSE 未结束：把持续更新中的 streamingMsg 追加到列表末尾
                this.messages.push(pending.streamingMsg);
                this.streaming = true;
                this.sendDisabled = true;
                this.scrollBubblesToBottom();
            }
            after?.();
        });
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
            this.openSse(chatId, message);
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

    /** 打开 SSE 连接并监听流式事件；支持后台运行，切换 chat 后继续缓存 */
    private openSse(chatId: number, message: string): void {
        // 若该会话已有 SSE（如重新生成），先关掉旧的
        const existing = this.pendingSse.get(chatId);
        if (existing) {
            existing.eventSource.close();
            this.pendingSse.delete(chatId);
        }

        const streamingMsg = this.messages[this.messages.length - 1];
        const state: ChatSseState = {
            eventSource: null!,
            accumulatedMarkdown: '',
            streamingMsg,
            frozenEndPos: 0
        };

        const token = this.tokenService.get()?.token || '';
        const url = RestPath.erupt + `/ai/chat/send?chatId=${chatId}&message=${encodeURIComponent(message)}&_token=${encodeURIComponent(token)}&agentId=${this.selectAgentId ?? ''}&llmId=${this.llmId}&autoToolCall=${this.autoToolCall}`;
        state.eventSource = new EventSource(url);
        this.pendingSse.set(chatId, state);
        this.streaming = true;

        const isActive = () => this.selectChat === chatId;

        state.eventSource.onmessage = (event) => {
            const data: SseMessage = JSON.parse(event.data);

            if (data.event === SseMessageEvent.TOKEN) {
                if (!data.data) return;
                state.accumulatedMarkdown += data.data;

                // 找到最后一个完整代码块的末尾位置
                const codeBlockRe = /```(?:echarts|mermaid)[\s\S]*?```/g;
                let newFrozenEnd = 0;
                let m: RegExpExecArray | null;
                while ((m = codeBlockRe.exec(state.accumulatedMarkdown)) !== null) {
                    newFrozenEnd = m.index + m[0].length;
                }

                const hasNewSegment = newFrozenEnd > state.frozenEndPos;
                const segmentMd = hasNewSegment
                    ? state.accumulatedMarkdown.slice(state.frozenEndPos, newFrozenEnd) : null;
                const tailMd = state.accumulatedMarkdown.slice(newFrozenEnd || state.frozenEndPos);

                const tasks: Promise<string>[] = [this.markdown.render(tailMd)];
                if (segmentMd !== null) tasks.unshift(this.markdown.render(segmentMd));

                Promise.all(tasks).then(([r0, r1]) => {
                    const segmentHtml = segmentMd !== null ? r0 : null;
                    const tailHtml = segmentMd !== null ? r1 : r0;

                    const msg = state.streamingMsg;
                    if (msg.loading) msg.loading = false;
                    msg.streamingTick = (msg.streamingTick ?? 0) + 1;
                    msg.contentHtml = tailHtml;
                    msg.content = state.accumulatedMarkdown;
                    if (segmentHtml !== null) {
                        msg.frozenSegments = [...(msg.frozenSegments ?? []), segmentHtml];
                        state.frozenEndPos = newFrozenEnd;
                    }

                    if (isActive()) {
                        this.ngZone.run(() => {
                            this.sending = false;
                            this.sendDisabled = true;
                            this.scrollSubject.next();
                            if (segmentHtml !== null) {
                                setTimeout(() => {
                                    const el = this.bubblesRef?.nativeElement;
                                    if (!el) return;
                                    if (el.querySelector('.mermaid:not([data-processed])')) this.markdown.runMermaid(el).then();
                                    if (el.querySelector('.echarts-block:not([data-processed])')) this.markdown.runEcharts(el).then();
                                }, 0);
                            }
                        });
                    }
                });

            } else if (data.event === SseMessageEvent.THINK) {
                state.streamingMsg.think = data.data;
                if (isActive()) {
                    this.ngZone.run(() => setTimeout(() => this.scrollSubject.next()));
                }

            } else if (data.event === SseMessageEvent.DONE) {
                // 流结束：用完整 markdown 重新渲染，清除 frozenSegments 合并为单一 HTML
                this.markdown.render(state.accumulatedMarkdown).then(fullHtml => {
                    state.streamingMsg.frozenSegments = undefined;
                    state.streamingMsg.contentHtml = fullHtml;
                    this.ngZone.run(() => {
                        state.eventSource.close();
                        this.pendingSse.delete(chatId);
                        if (isActive()) {
                            this.streaming = false;
                            this.sendDisabled = false;
                            this.sending = false;
                            this.scrollSubject.next();
                            setTimeout(() => {
                                this.scrollBubblesToBottom();
                                const el = this.bubblesRef?.nativeElement;
                                if (el) this.markdown.runMermaid(el).then();
                                if (el) this.markdown.runEcharts(el).then();
                            }, 50);
                        }
                    });
                });
            }
        };

        state.eventSource.onerror = () => {
            setTimeout(() => {
                this.ngZone.run(() => {
                    state.eventSource.close();
                    this.pendingSse.delete(chatId);
                    if (isActive()) {
                        this.streaming = false;
                        this.sendDisabled = false;
                        this.sending = false;
                        const el = this.bubblesRef?.nativeElement;
                        if (el) this.markdown.runMermaid(el).then();
                        if (el) this.markdown.runEcharts(el).then();
                    }
                });
            }, 100);
        };

        state.eventSource.onopen = () => {
            if (isActive()) this.sendDisabled = true;
        };
    }

    /** 将用户消息填回输入框并截断后续消息，支持回溯编辑 */
    editResend(item: ChatMessage, index: number): void {
        this.content = item.content;
        this.messages = this.messages.slice(0, index);
        setTimeout(() => this.textareaRef?.nativeElement?.focus(), 50);
    }

    /** 将模型消息以引用块格式追加到输入框 */
    quoteToInput(item: ChatMessage): void {
        const quoted = item.content.split('\n').map(line => `> ${line}`).join('\n');
        this.content = this.content ? `${this.content}\n\n${quoted}\n\n` : `${quoted}\n\n`;
        setTimeout(() => this.textareaRef?.nativeElement?.focus(), 50);
    }

    /** 切换朗读状态（Web Speech API） */
    toggleSpeak(item: ChatMessage): void {
        if (item.speaking) {
            speechSynthesis.cancel();
            item.speaking = false;
            this.speakingMessage = null;
            return;
        }
        if (this.speakingMessage) {
            this.speakingMessage.speaking = false;
            speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(item.content || '');
        utterance.onend = () => this.ngZone.run(() => {
            item.speaking = false;
            this.speakingMessage = null;
        });
        item.speaking = true;
        this.speakingMessage = item;
        speechSynthesis.speak(utterance);
    }

    /** 复制消息内容到剪贴板 */
    copyMessage(item: ChatMessage): void {
        navigator.clipboard.writeText(item.content || '').then(() => {
            item.copied = true;
            setTimeout(() => item.copied = false, 2000);
        });
    }

    /** 切换思考过程折叠状态 */
    toggleThink(item: ChatMessage): void {
        item.thinkCollapsed = !item.thinkCollapsed;
    }

    /** 重新生成指定索引处的模型消息 */
    regenerate(index: number): void {
        if (this.sending || this.streaming || this.selectChat == null) return;
        let userContent = '';
        for (let i = index - 1; i >= 0; i--) {
            if (this.messages[i].senderType === 'USER') {
                userContent = this.messages[i].content;
                break;
            }
        }
        if (!userContent) return;
        this.messages = this.messages.slice(0, index);
        this.messages.push({
            id: Math.random(),
            senderType: 'MODEL',
            content: '',
            createTime: '',
            loading: true
        } as ChatMessage);
        this.sending = true;
        this.sendDisabled = true;
        setTimeout(() => this.scrollBubblesToBottom(), 10);
        this.openSse(this.selectChat, userContent);
    }

    /** 模型消息展示用 HTML：优先 contentHtml（流式已渲染），否则将 content 当 Markdown 渲染 */
    getMessageHtml(item: ChatMessage): string {
        if (item.senderType === 'USER') {
            return this.escapeHtml(item.content);
        }
        if (item.contentHtml) return item.contentHtml;
        if (!item.content) return '';
        if (item.rendering) return this.escapeHtml(item.content);
        item.rendering = true;
        this.markdown.render(item.content).then(html => {
            this.ngZone.run(() => {
                item.contentHtml = html;
                item.rendering = false;
            });
        });
        return this.escapeHtml(item.content);
    }

    private escapeHtml(s: string): string {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    /** 是否在消息区底部缓冲区内（用户在看最新内容） */
    private isBubblesNearBottom(): boolean {
        const el = this.bubblesRef?.nativeElement;
        if (!el) return false;
        const {scrollTop, scrollHeight, clientHeight} = el;
        return scrollTop + clientHeight >= scrollHeight - BUBBLES_BOTTOM_BUFFER_PX;
    }

    scrollBubblesToBottom(): void {
        const el = this.bubblesRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
        this.showScrollToBottom = false;
    }

    deleteChat(chatId: number, event: Event): void {
        event.stopPropagation();
        this.modal.confirm({
            nzTitle: this.i18n.fanyi('ai.chat.delete_confirm_title'),
            nzContent: this.i18n.fanyi('ai.chat.delete_confirm_content'),
            nzOkText: this.i18n.fanyi('global.ok'),
            nzOkDanger: true,
            nzCancelText: this.i18n.fanyi('global.cancel'),
            nzOnOk: () =>
                new Promise<void>((resolve, reject) => {
                    this.chatApi.deleteChat(chatId).subscribe({
                        next: () => {
                            this.fetchChats();
                            this.message.success(this.i18n.fanyi('ai.chat.deleted'));
                            resolve();
                        },
                        error: err => reject(err)
                    });
                })
        });
    }

    renameChat(chatId: number, currentTitle: string, event: Event): void {
        event.stopPropagation();
        this.renameTitle = currentTitle;
        this.renameChatId = chatId;
        this.modal.create({
            nzTitle: this.i18n.fanyi('ai.chat.rename_modal_title'),
            nzContent: this.renameModalTpl,
            nzOkText: this.i18n.fanyi('global.ok'),
            nzCancelText: this.i18n.fanyi('global.cancel'),
            nzOnOk: () =>
                new Promise<void>((resolve, reject) => {
                    const newTitle = this.renameTitle?.trim();
                    if (!newTitle) {
                        this.message.error(this.i18n.fanyi('ai.chat.rename_empty_error'));
                        reject();
                        return;
                    }
                    const id = this.renameChatId;
                    if (id == null) {
                        reject();
                        return;
                    }
                    this.chatApi.renameChat(id, newTitle).subscribe({
                        next: () => {
                            const chat = this.chats.find(c => c.id === id);
                            if (chat) {
                                chat.title = newTitle;
                            }
                            this.message.success(this.i18n.fanyi('ai.chat.rename_success'));
                            this.renameChatId = null;
                            resolve();
                        },
                        error: err => {
                            reject(err);
                        }
                    });
                })
        });
    }

    onBubbleScroll(): void {
        const el = this.bubblesRef?.nativeElement;
        if (!el) return;
        this.showScrollToBottom = !this.isBubblesNearBottom();
        if (!this.loadingMoreMessages && this.hasMoreMessages && this.selectChat != null && el.scrollTop <= 10) {
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

    /** 切换全屏：主区域铺满视口并隐藏侧边栏 */
    toggleFullscreen(): void {
        this.fullscreen = !this.fullscreen;
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem('ai-chat-sidebar-collapsed', this.sidebarCollapsed ? '1' : '0');
    }

    /** 清空输入框 */
    clearInput(): void {
        this.content = '';
    }

    /** 停止当前会话的流式响应 */
    stopGeneration(): void {
        if (this.selectChat == null) return;
        const state = this.pendingSse.get(this.selectChat);
        if (state) {
            state.eventSource.close();
            this.pendingSse.delete(this.selectChat);
        }
        this.streaming = false;
        this.sending = false;
        this.sendDisabled = false;
        const last = this.messages[this.messages.length - 1];
        if (last?.loading) {
            last.loading = false;
            const md = state?.accumulatedMarkdown || '';
            if (md) {
                last.content = md;
                this.markdown.render(md).then(html => { last.contentHtml = html; });
            } else {
                last.content = this.i18n.fanyi('ai.chat.stopped');
                last.contentHtml = `<p>${this.i18n.fanyi('ai.chat.stopped')}</p>`;
            }
        }
    }

}
