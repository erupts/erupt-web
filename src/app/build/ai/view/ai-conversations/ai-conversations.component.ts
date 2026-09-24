import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {SharedModule} from '@shared/shared.module';
import {Chat} from '../../model/chat.model';

/** Time bucket a conversation falls into; the key doubles as the i18n suffix */
enum ChatGroup {
    TODAY = 'today',
    YESTERDAY = 'yesterday',
    WEEK = 'week',
    EARLIER = 'earlier'
}

interface ChatGroupView {
    key: ChatGroup;
    items: Chat[];
}

/** Distance from the bottom (px) at which loading more is triggered */
const LOAD_MORE_THRESHOLD = 40;

/**
 * Conversation list panel of the AI chat page, modelled after Ant Design X `Conversations`:
 * a new-chat button, a quick filter and the sessions grouped by time with hover actions.
 * Stateless apart from the filter keyword; the parent owns the data and the rename / delete dialogs.
 */
@Component({
    standalone: true,
    selector: 'erupt-ai-conversations',
    templateUrl: './ai-conversations.component.html',
    styleUrls: ['./ai-conversations.component.less'],
    imports: [SharedModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiConversationsComponent implements OnChanges {
    constructor(private cdr: ChangeDetectorRef) {}

    @Input() items: Chat[] = [];
    @Input() activeId: number | null = null;
    @Input() loading = false;
    @Input() loadingMore = false;
    @Input() hasMore = false;
    /** Hide the fold button (e.g. embedded mode where the panel is an overlay) */
    @Input() foldable = true;

    /** Not named `select`: Angular would also fire it for the native DOM `select` event bubbling from the search input */
    @Output() readonly activate = new EventEmitter<Chat>();
    @Output() readonly create = new EventEmitter<void>();
    @Output() readonly rename = new EventEmitter<Chat>();
    @Output() readonly remove = new EventEmitter<Chat>();
    @Output() readonly loadMore = new EventEmitter<void>();
    @Output() readonly fold = new EventEmitter<void>();

    @ViewChild('listRef') listRef!: ElementRef<HTMLDivElement>;
    @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

    keyword = '';
    /** The header shows the title by default; the search field replaces it while open */
    searchOpen = false;
    groups: ChatGroupView[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['items']) this.rebuild();
    }

    onKeywordChange(): void {
        this.rebuild();
    }

    openSearch(): void {
        this.searchOpen = true;
        this.cdr.detectChanges();
        this.searchInput?.nativeElement.focus();
    }

    closeSearch(): void {
        this.searchOpen = false;
        if (this.keyword) {
            this.keyword = '';
            this.rebuild();
        }
    }

    /** Leaving an empty field folds it back into the icon; a keyword keeps the filter visible */
    onSearchBlur(): void {
        if (!this.keyword.trim()) this.closeSearch();
    }

    onScroll(): void {
        if (this.loadingMore || !this.hasMore) return;
        const el = this.listRef?.nativeElement;
        if (el && el.scrollHeight - el.scrollTop - el.clientHeight <= LOAD_MORE_THRESHOLD) {
            this.loadMore.emit();
        }
    }

    onAction(event: Event, emitter: EventEmitter<Chat>, chat: Chat): void {
        event.stopPropagation();
        emitter.emit(chat);
    }

    private rebuild(): void {
        const kw = this.keyword.trim().toLowerCase();
        const list = kw ? this.items.filter(c => c.title?.toLowerCase().includes(kw)) : this.items;
        const buckets = new Map<ChatGroup, Chat[]>();
        for (const chat of list) {
            const key = this.groupOf(chat);
            (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(chat);
        }
        this.groups = Object.values(ChatGroup)
            .filter(key => buckets.has(key))
            .map(key => ({key, items: buckets.get(key)!}));
    }

    private groupOf(chat: Chat): ChatGroup {
        if (!chat.createdTime) return ChatGroup.EARLIER;
        // backend serializes LocalDateTime as "yyyy-MM-dd HH:mm:ss"
        const created = new Date(chat.createdTime.replace(' ', 'T'));
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const dayDiff = Math.floor((startOfToday.getTime() - created.getTime()) / 86_400_000) + 1;
        if (dayDiff <= 0) return ChatGroup.TODAY;
        if (dayDiff === 1) return ChatGroup.YESTERDAY;
        if (dayDiff < 7) return ChatGroup.WEEK;
        return ChatGroup.EARLIER;
    }
}
