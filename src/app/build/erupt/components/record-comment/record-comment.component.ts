import {AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {of, Subject, Subscription} from "rxjs";
import {catchError, debounceTime, switchMap} from "rxjs/operators";
import {DataService} from "@shared/service/data.service";
import {MentionUser, RecordComment} from "../../model/record-comment.model";

interface CommentThread {
    head: RecordComment;
    replies: RecordComment[];
    // a resolved thread starts collapsed; the user may open it for the session
    expanded: boolean;
}

// a piece of comment content: plain text, or an @mention to highlight
interface ContentPart {
    text: string;
    mention?: MentionUser;
}

// avatar hues for commenters without a picture, picked by a hash of the name
const AVATAR_COLORS = ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae", "#1677ff", "#eb2f96", "#52c41a", "#fa541c"];

/**
 * Comment stream of one record (erupt-comment module): threads one level deep in time order,
 * newest at the bottom like a chat, pinned threads first, resolved threads collapsed, a composer
 * pinned below with @mention completion, delete for the author's own comments. Opened in a
 * drawer from the table row or the record panel.
 */
@Component({
    standalone: false,
    selector: "erupt-record-comment",
    templateUrl: "./record-comment.component.html",
    styleUrls: ["./record-comment.component.less"]
})
export class RecordCommentComponent implements OnInit, AfterViewChecked, OnDestroy {

    @Input() eruptName: string;

    @Input() id: any;

    @ViewChild("list") listEl: ElementRef<HTMLElement>;

    @ViewChild("input") inputEl: ElementRef<HTMLTextAreaElement>;

    threads: CommentThread[] = [];

    // true until the first list response, drives the skeleton
    initializing = true;

    loading = false;

    sending = false;

    draft = "";

    // thread head the draft answers (replies always attach to the head, one level deep)
    replyTo?: RecordComment;

    // commenter the reply is aimed at; differs from replyTo when answering a reply
    replyName?: string;

    // users inserted into the draft through the @ picker; those still named on send are submitted
    draftMentions: MentionUser[] = [];

    // ---- @ completion ----
    mentionOpen = false;

    mentionQuery = "";

    mentionOptions: MentionUser[] = [];

    mentionIndex = 0;

    mentionLoading = false;

    // caret position of the "@" the completion started from
    private mentionStart = -1;

    private mentionSearch$ = new Subject<string>();

    private mentionSub: Subscription;

    private scrollPending = false;

    // per-thread expanded state survives a reload
    private expandedHeads = new Set<number>();

    constructor(private dataService: DataService) {
    }

    ngOnInit() {
        // No distinctUntilChanged here: reopening the picker replays the same empty query, and
        // dropping it would leave the panel stuck on an empty list. The failure is caught inside
        // the switchMap so one bad response cannot terminate the stream for the rest of the session.
        this.mentionSub = this.mentionSearch$.pipe(
            debounceTime(150),
            switchMap(q => this.dataService.commentMentionUsers(this.eruptName, q).pipe(
                catchError(() => of(null))
            ))
        ).subscribe(res => {
            this.mentionLoading = false;
            this.mentionOptions = res?.success ? (res.data || []) : [];
            this.mentionIndex = 0;
        });
        this.load(true);
    }

    ngOnDestroy() {
        this.mentionSub?.unsubscribe();
    }

    ngAfterViewChecked() {
        if (this.scrollPending && this.listEl) {
            this.scrollPending = false;
            const el = this.listEl.nativeElement;
            el.scrollTop = el.scrollHeight;
        }
    }

    load(scrollToEnd = false) {
        this.loading = true;
        this.dataService.commentList(this.eruptName, this.id).subscribe({
            next: res => {
                this.loading = false;
                this.initializing = false;
                if (res.success) {
                    this.group(res.data || []);
                    this.scrollPending = scrollToEnd;
                }
            },
            error: () => {
                this.loading = false;
                this.initializing = false;
            }
        });
    }

    // pinned threads lead, the rest keep the server's time order; resolved threads collapse
    private group(comments: RecordComment[]) {
        const heads = new Map<number, CommentThread>();
        comments.filter(c => !c.parentId).forEach(c => heads.set(c.id, {
            head: c, replies: [], expanded: !c.resolved || this.expandedHeads.has(c.id)
        }));
        comments.filter(c => c.parentId).forEach(c => heads.get(c.parentId)?.replies.push(c));
        const all = [...heads.values()];
        this.threads = [...all.filter(t => t.head.pinned), ...all.filter(t => !t.head.pinned)];
    }

    toggleThread(t: CommentThread) {
        t.expanded = !t.expanded;
        if (t.expanded) {
            this.expandedHeads.add(t.head.id);
        } else {
            this.expandedHeads.delete(t.head.id);
        }
    }

    setFlag(t: CommentThread, flag: "resolved" | "pinned", value: boolean) {
        this.dataService.commentFlag(this.eruptName, this.id, t.head.id, flag, value).subscribe(res => {
            if (!res.success) return;
            if (flag === "resolved") this.expandedHeads.delete(t.head.id);
            this.load();
        });
    }

    // ---- replying ----

    reply(target: RecordComment, head: RecordComment) {
        this.replyTo = head;
        this.replyName = target.userName;
        this.inputEl?.nativeElement.focus();
    }

    cancelReply() {
        this.replyTo = undefined;
        this.replyName = undefined;
    }

    // ---- composer ----

    onInput() {
        this.detectMention();
    }

    onKeydown(e: KeyboardEvent) {
        if (this.mentionOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const n = this.mentionOptions.length;
                if (n) this.mentionIndex = (this.mentionIndex + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
                return;
            }
            if ((e.key === "Enter" || e.key === "Tab") && !e.isComposing && this.mentionOptions.length) {
                e.preventDefault();
                this.pickMention(this.mentionOptions[this.mentionIndex]);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                this.closeMention();
                return;
            }
        }
        // Enter sends, Shift + Enter breaks the line (Ctrl / Cmd + Enter still sends); an Enter that
        // commits an IME candidate is left to the input method
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            this.send();
        } else if (e.key === "Escape" && this.replyTo) {
            e.preventDefault();
            this.cancelReply();
        }
    }

    // The picker opens when the caret sits right after "@…" that starts a word; the text between
    // the "@" and the caret is the query. Any space closes it.
    private detectMention() {
        const el = this.inputEl?.nativeElement;
        if (!el) return;
        const caret = el.selectionStart ?? this.draft.length;
        const before = this.draft.slice(0, caret);
        const at = before.lastIndexOf("@");
        if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) {
            this.closeMention();
            return;
        }
        const query = before.slice(at + 1);
        if (/\s/.test(query) || query.length > 20) {
            this.closeMention();
            return;
        }
        this.mentionStart = at;
        this.mentionQuery = query;
        if (!this.mentionOpen) {
            this.mentionOpen = true;
            this.mentionOptions = [];
        }
        // Flagged before the debounce so a freshly opened picker shows the spinner instead of
        // "no matching user"; while options are already on screen they stay put until the next result.
        this.mentionLoading = true;
        this.mentionSearch$.next(query);
    }

    pickMention(user: MentionUser) {
        const el = this.inputEl?.nativeElement;
        const caret = el?.selectionStart ?? this.draft.length;
        const token = "@" + user.name + " ";
        this.draft = this.draft.slice(0, this.mentionStart) + token + this.draft.slice(caret);
        if (!this.draftMentions.some(m => m.id === user.id)) this.draftMentions.push(user);
        this.closeMention();
        const pos = this.mentionStart + token.length;
        setTimeout(() => {
            el?.focus();
            el?.setSelectionRange(pos, pos);
        });
    }

    closeMention() {
        this.mentionOpen = false;
        this.mentionOptions = [];
        this.mentionStart = -1;
        this.mentionLoading = false;
    }

    send() {
        const content = this.draft.trim();
        if (!content || this.sending) return;
        this.sending = true;
        const mentions = this.draftMentions.filter(m => content.includes("@" + m.name)).map(m => m.id);
        this.dataService.commentAdd(this.eruptName, this.id, content, this.replyTo?.id, mentions).subscribe({
            next: res => {
                this.sending = false;
                if (!res.success) return;
                this.draft = "";
                this.draftMentions = [];
                this.cancelReply();
                this.load(true);
            },
            error: () => this.sending = false
        });
    }

    remove(comment: RecordComment) {
        this.dataService.commentDelete(this.eruptName, this.id, comment.id).subscribe(res => {
            if (res.success) this.load();
        });
    }

    // ---- rendering helpers ----

    // splits the content so the names of mentioned users render as highlighted chips
    parts(c: RecordComment): ContentPart[] {
        if (!c.mentions?.length) return [{text: c.content}];
        const names = [...c.mentions].sort((a, b) => b.name.length - a.name.length);
        const pattern = new RegExp("@(" + names.map(m => m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "g");
        const result: ContentPart[] = [];
        let last = 0;
        for (const match of c.content.matchAll(pattern)) {
            if (match.index > last) result.push({text: c.content.slice(last, match.index)});
            result.push({text: match[0], mention: c.mentions.find(m => m.name === match[1])});
            last = match.index + match[0].length;
        }
        if (last < c.content.length) result.push({text: c.content.slice(last)});
        return result;
    }

    initial(name?: string): string {
        return (name || "?").trim().charAt(0).toUpperCase();
    }

    avatarColor(name?: string): string {
        let hash = 0;
        for (const ch of name || "") hash = (hash * 31 + ch.charCodeAt(0)) | 0;
        return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    // compact time: clock for today, month-day for this year, full date otherwise
    timeText(value: string): string {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const clock = pad(d.getHours()) + ":" + pad(d.getMinutes());
        if (d.toDateString() === now.toDateString()) return clock;
        const day = pad(d.getMonth() + 1) + "-" + pad(d.getDate());
        return (d.getFullYear() === now.getFullYear() ? day : d.getFullYear() + "-" + day) + " " + clock;
    }

}
