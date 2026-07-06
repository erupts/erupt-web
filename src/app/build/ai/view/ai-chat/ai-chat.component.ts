import {AfterViewChecked, Component, ElementRef, Inject, Input, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SharedModule} from '@shared/shared.module';
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

/** Number of items per page in the chat list */
const CHAT_PAGE_SIZE = 20;

/** Cache of ongoing SSE state for each chat session */
interface ChatSseState {
    eventSource: EventSource;
    /** Accumulated markdown text for the current token segment */
    accumulatedMarkdown: string;
    /** Reference to the message object being streamed (always holds the latest content, appended to the list when switching back) */
    streamingMsg: ChatMessage;
    /** Frozen end position in the accumulated markdown (position after the last complete code block) */
    frozenEndPos: number;
    /** Render debounce timer to prevent page freeze from high-frequency tokens */
    renderTimer: ReturnType<typeof setTimeout> | null;
    /** Previous SSE event type, used to detect call/token transitions */
    lastEventType: 'call' | 'token' | null;
    /** Previous call name; duplicates with the same name are deduplicated and not rendered */
    lastCallName: string;
}
/** Distance from the bottom (px) at which loading more chats is triggered */
const CHAT_SCROLL_THRESHOLD = 80;
/** Buffer in px for considering the message area "at the bottom": auto-scroll to bottom only when the user is within this range */
const BUBBLES_BOTTOM_BUFFER_PX = 300;

@Component({
    standalone: true,
    selector: 'erupt-ai-chat',
    templateUrl: './ai-chat.component.html',
    styleUrls: ['./ai-chat.component.less'],
    imports: [SharedModule],
    providers: [ChatApiService, MarkdownService]
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @Input() collapseSidebar = false;

    @Input() embedded = false;

    @Input() context = '';

    @ViewChild('bubblesRef') bubblesRef!: ElementRef<HTMLDivElement>;
    @ViewChild('chatListRef') chatListRef!: ElementRef<HTMLUListElement>;
    @ViewChild('renameModalTpl') renameModalTpl!: TemplateRef<unknown>;
    @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;
    @ViewChild('senderWrapRef') senderWrapRef!: ElementRef<HTMLDivElement>;

    chats: Chat[] = [];
    agents: Agent[] = [];
    messages: ChatMessage[] = [];
    selectChat: number | null = null;
    /** Selected agent id, bound to the dropdown; use get selectAgent() to retrieve the full object when sending */
    selectAgentId: number | null = null;
    content = '';
    /** Chat search keyword */
    chatSearchKeyword = '';
    /** Input history */
    private inputHistory: string[] = [];
    private historyIndex = -1;
    private historyDraft = '';
    sending = false;
    sendDisabled = false;
    messagePage = 1;
    loadingMoreMessages = false;
    hasMoreMessages = true;
    /** Chat list pagination: current page (1-based) */
    chatPage = 1;
    /** Whether there are more chats to load */
    hasMoreChats = true;
    /** Whether more chats are currently being loaded */
    loadingMoreChats = false;
    /** Whether the chat list is loading (first screen) */
    loadingChats = false;
    /** Whether the message list is loading (first screen after selecting a chat) */
    loadingMessages = false;
    /** Whether automatic tool call is enabled */
    autoToolCall = true;
    /** Whether fullscreen mode is active */
    fullscreen = false;
    private static readonly LAYOUT_KEY = 'ai-chat-layout';
    private static readonly layoutStorage = JSON.parse(localStorage.getItem(AiChatComponent.LAYOUT_KEY) || '{}');
    private saveLayout(): void {
        localStorage.setItem(AiChatComponent.LAYOUT_KEY, JSON.stringify({
            sidebarCollapsed: this.sidebarCollapsed,
            sidebarWidth: this.sidebarWidth,
            senderWrapHeight: this.senderWrapHeight,
            wideMode: this.wideMode
        }));
    }
    /** Message area wide mode (true = full width, false = fixed max width) */
    wideMode = AiChatComponent.layoutStorage.wideMode !== false;
    /** Whether the sidebar is collapsed */
    sidebarCollapsed = !!AiChatComponent.layoutStorage.sidebarCollapsed;
    /** Sidebar width (px) */
    sidebarWidth: number = AiChatComponent.layoutStorage.sidebarWidth || 220;
    /** Input area height (px), null means auto */
    senderWrapHeight: number | null = AiChatComponent.layoutStorage.senderWrapHeight || null;
    /** Whether to show the "scroll to bottom" button */
    showScrollToBottom = false;
    /** Whether streaming output is in progress (used to display the cursor at the end, shares lifecycle with eventSource) */
    streaming = false;
    /** Input value in the rename modal */
    renameTitle = '';
    /** Chat id of the current rename operation, used in nzOnOk */
    private renameChatId: number | null = null;
    /** Running SSE state for each chat, keyed by chatId */
    private pendingSse = new Map<number, ChatSseState>();
    private llmId = '';
    private scrollSubject = new Subject<void>();
    private speakingMessage: ChatMessage | null = null;

    get selectedAgent(): Agent | undefined {
        return this.agents.find(a => a.id === this.selectAgentId);
    }

    get filteredChats(): Chat[] {
        const kw = this.chatSearchKeyword?.trim().toLowerCase();
        return kw ? this.chats.filter(c => c.title?.toLowerCase().includes(kw)) : this.chats;
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
        if (this.collapseSidebar) this.sidebarCollapsed = true;
        if (this.embedded) {
            this.wideMode = false;
            this.sidebarCollapsed = true;
        }
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

    /** Fetch the chat list: when reset is true, re-fetch from the first page and select the first item */
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

    /** Chat list scroll: load the next page when reaching the bottom */
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
        // in embedded mode the sidebar overlays the chat, so close it once a conversation is picked
        if (this.embedded) {
            this.sidebarCollapsed = true;
        }
        // reset UI state (without closing SSE connections of other chats)
        this.selectChat = chatId;
        this.sending = false;
        this.streaming = false;
        this.sendDisabled = false;
        this.messagePage = 1;
        this.hasMoreMessages = true;
        this.messages = [];

        // always fetch persisted messages from the backend; after fetching, append streaming message if SSE is still running
        this.fetchMessages(chatId, true, () => {
            const pending = this.pendingSse.get(chatId);
            if (pending) {
                // SSE not yet finished: append the continuously updating streamingMsg to the end of the list
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
        this.inputHistory.push(message.trim());
        this.historyIndex = -1;
        const doStart = (chatId: number) => {
            this.sending = true;
            this.content = '';
            this.messages.push({
                id: Math.random(),
                senderType: 'USER',
                content: message,
                loading: false
            } as ChatMessage);
            this.messages.push({
                id: Math.random(),
                senderType: 'MODEL',
                content: '',
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

    /** Open an SSE connection and listen for streaming events; supports background operation, caching continues after switching chats */
    private openSse(chatId: number, message: string): void {
        // if this chat already has an SSE connection (e.g. regenerating), close the old one first
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
            frozenEndPos: 0,
            renderTimer: null,
            lastEventType: null,
            lastCallName: ''
        };

        const token = this.tokenService.get()?.token || '';
        const contextParam = this.context ? `&contextPrompt=${encodeURIComponent(this.context)}` : '';
        const url = RestPath.erupt + `/ai/chat/send?chatId=${chatId}&message=${encodeURIComponent(message)}&_token=${encodeURIComponent(token)}&agentId=${this.selectAgentId ?? ''}&llmId=${this.llmId}&autoToolCall=${this.autoToolCall}${contextParam}`;
        state.eventSource = new EventSource(url);
        this.pendingSse.set(chatId, state);
        this.streaming = true;

        const isActive = () => this.selectChat === chatId;

        state.eventSource.onmessage = (event) => {
            const data: SseMessage = JSON.parse(event.data);

            if (data.event === SseMessageEvent.TOKEN) {
                if (!data.data) return;
                const msg = state.streamingMsg;

                state.lastEventType = 'token';
                state.accumulatedMarkdown += data.data;

                if (msg.loading) {
                    msg.loading = false;
                    if (isActive()) this.ngZone.run(() => {});
                }

                if (state.renderTimer !== null) clearTimeout(state.renderTimer);
                state.renderTimer = setTimeout(() => {
                    state.renderTimer = null;

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
                    // snapshot the current value to prevent it from being cleared by a CALL event before the Promise callback runs
                    const contentSnapshot = state.accumulatedMarkdown;

                    const tasks: Promise<string>[] = [this.markdown.render(tailMd)];
                    if (segmentMd !== null) tasks.unshift(this.markdown.render(segmentMd));

                    Promise.all(tasks).then(([r0, r1]) => {
                        const segmentHtml = segmentMd !== null ? r0 : null;
                        const tailHtml = segmentMd !== null ? r1 : r0;

                        msg.streamingTick = (msg.streamingTick ?? 0) + 1;
                        msg.contentHtml = tailHtml;
                        msg.content = contentSnapshot;
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
                }, 30);

            } else if (data.event === SseMessageEvent.CALL) {
                if (!data.data) return;
                const msg = state.streamingMsg;
                // deduplicate calls with the same name
                if (data.data === state.lastCallName) return;
                state.lastCallName = data.data;
                state.lastEventType = 'call';

                if (state.renderTimer !== null) { clearTimeout(state.renderTimer); state.renderTimer = null; }

                // inject call block HTML directly into accumulatedMarkdown to render in the same stream as tokens
                state.accumulatedMarkdown += '\n\n' + this.callBlockHtml(data.data) + '\n\n';

                if (msg.loading) {
                    msg.loading = false;
                    if (isActive()) this.ngZone.run(() => {});
                }

                const contentSnapshot = state.accumulatedMarkdown;
                const tailMd = state.accumulatedMarkdown.slice(state.frozenEndPos);
                this.markdown.render(tailMd).then(html => {
                    msg.contentHtml = html;
                    msg.content = contentSnapshot;
                    if (isActive()) this.ngZone.run(() => this.scrollSubject.next());
                });

            } else if (data.event === SseMessageEvent.DONE) {
                if (state.renderTimer !== null) { clearTimeout(state.renderTimer); state.renderTimer = null; }
                const finalize = async () => {
                    const tokenHtml = await this.markdown.render(state.accumulatedMarkdown);
                    const frozen = state.streamingMsg.frozenSegments ?? [];
                    state.streamingMsg.frozenSegments = undefined;
                    state.streamingMsg.contentHtml = frozen.join('') + tokenHtml;
                    state.streamingMsg.content = state.accumulatedMarkdown;
                };
                finalize().then(() => {
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
                    if (state.renderTimer !== null) { clearTimeout(state.renderTimer); state.renderTimer = null; }
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

    /** Fill the user message back into the input box and truncate subsequent messages, supporting back-editing */
    editResend(item: ChatMessage, index: number): void {
        this.content = item.content;
        this.messages = this.messages.slice(0, index);
        setTimeout(() => this.textareaRef?.nativeElement?.focus(), 50);
    }

    /** Append the model message to the input box as a quote block */
    quoteToInput(item: ChatMessage): void {
        const quoted = item.content.split('\n').map(line => `> ${line}`).join('\n');
        this.content = this.content ? `${this.content}\n\n${quoted}\n\n` : `${quoted}\n\n`;
        setTimeout(() => this.textareaRef?.nativeElement?.focus(), 50);
    }

    /** Toggle text-to-speech state (Web Speech API) */
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

    /** Copy message content to clipboard */
    copyMessage(item: ChatMessage): void {
        navigator.clipboard.writeText(item.content || '').then(() => {
            item.copied = true;
            setTimeout(() => item.copied = false, 2000);
        });
    }

    /** Regenerate the model message at the specified index */
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
            loading: true
        } as ChatMessage);
        this.sending = true;
        this.sendDisabled = true;
        setTimeout(() => this.scrollBubblesToBottom(), 10);
        this.openSse(this.selectChat, userContent);
    }

    /** HTML for displaying model messages: prefer contentHtml (already rendered during streaming), otherwise asynchronously render content (including historical think blocks) */
    getMessageHtml(item: ChatMessage): string {
        if (item.senderType === 'USER') return this.escapeHtml(item.content);
        if (item.contentHtml) return item.contentHtml;
        if (!item.content && !item.think) return '';
        if (item.rendering) return this.escapeHtml(item.content || '');
        item.rendering = true;
        const p = item.content ? this.markdown.render(item.content) : Promise.resolve('');
        p.then(contentHtml => {
            this.ngZone.run(() => {
                let html = item.think ? this.callBlockHtml(item.think) : '';
                html += contentHtml;
                item.contentHtml = html;
                item.rendering = false;
            });
        });
        return this.escapeHtml(item.content || '');
    }

    /** Format message time: show only hours and minutes for today, otherwise show date + hours and minutes */
    formatTime(createTime: string): string {
        if (!createTime) return this.i18n.fanyi('ai.chat.just_now');
        const d = new Date(createTime);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const time = d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        if (d.toDateString() === now.toDateString()) return time;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return `${this.i18n.fanyi('ai.chat.yesterday')} ${time}`;
        return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
    }

    private callBlockHtml(name: string): string {
        return `<div class="call-block-inline">${this.escapeHtml(name)}</div>`;
    }

    private escapeHtml(s: string): string {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    /** Whether the message area is within the bottom buffer (user is viewing the latest content) */
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

    /** Input box keydown: Enter to send, Shift+Enter for new line, arrow keys to browse input history */
    onInputKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.sendDisabled && this.content?.trim()) {
                this.send(this.content);
                this.content = '';
            }
            return;
        }
        if (!this.inputHistory.length) return;
        const textarea = e.target as HTMLTextAreaElement;
        if (e.key === 'ArrowUp' && textarea.selectionStart === 0) {
            e.preventDefault();
            if (this.historyIndex === -1) this.historyDraft = this.content;
            if (this.historyIndex < this.inputHistory.length - 1) {
                this.historyIndex++;
                this.content = this.inputHistory[this.inputHistory.length - 1 - this.historyIndex];
            }
        } else if (e.key === 'ArrowDown' && textarea.selectionStart === textarea.value.length) {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.content = this.inputHistory[this.inputHistory.length - 1 - this.historyIndex];
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                this.content = this.historyDraft;
            }
        }
    }

    /** Toggle fullscreen: expand the main area to fill the viewport and hide the sidebar */
    toggleFullscreen(): void {
        this.fullscreen = !this.fullscreen;
    }

    /** Toggle message area wide mode */
    toggleWideMode(): void {
        this.wideMode = !this.wideMode;
        this.saveLayout();
    }

    onResizerMousedown(e: MouseEvent): void {
        e.preventDefault();
        const startX = e.clientX;
        const startW = this.sidebarWidth;
        document.body.style.userSelect = 'none';
        const onMove = (ev: MouseEvent) => {
            this.sidebarWidth = Math.min(480, Math.max(160, startW + ev.clientX - startX));
        };
        const onUp = () => {
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.saveLayout();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    onSenderResizerMousedown(e: MouseEvent): void {
        e.preventDefault();
        const startY = e.clientY;
        const startH = this.senderWrapRef.nativeElement.getBoundingClientRect().height;
        document.body.style.userSelect = 'none';
        const onMove = (ev: MouseEvent) => {
            this.senderWrapHeight = Math.min(500, Math.max(160, startH + startY - ev.clientY));
        };
        const onUp = () => {
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.saveLayout();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        // embedded mode has its own forced-collapsed default; don't overwrite the full-page layout preference
        if (!this.embedded) {
            this.saveLayout();
        }
    }

    /** Clear the input box */
    clearInput(): void {
        this.content = '';
    }

    /** Stop the streaming response of the current chat */
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
            const frozen = last.frozenSegments ?? [];
            last.frozenSegments = undefined;
            if (md || frozen.length) {
                last.content = md;
                (md ? this.markdown.render(md) : Promise.resolve('')).then(tokenHtml => {
                    last.contentHtml = frozen.join('') + tokenHtml || `<p>${this.i18n.fanyi('ai.chat.stopped')}</p>`;
                });
            } else {
                last.content = this.i18n.fanyi('ai.chat.stopped');
                last.contentHtml = `<p>${this.i18n.fanyi('ai.chat.stopped')}</p>`;
            }
        }
    }

}
