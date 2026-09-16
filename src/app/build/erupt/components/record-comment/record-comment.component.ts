import {Component, Input, OnInit} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {RecordComment} from "../../model/record-comment.model";

interface CommentThread {
    head: RecordComment;
    replies: RecordComment[];
}

/**
 * Comment stream of one record (erupt-comment module): threads one level deep, a composer
 * at the bottom, delete for the author's own comments. Opened in a drawer from the record panel.
 */
@Component({
    standalone: false,
    selector: "erupt-record-comment",
    templateUrl: "./record-comment.component.html",
    styleUrls: ["./record-comment.component.less"]
})
export class RecordCommentComponent implements OnInit {

    @Input() eruptName: string;

    @Input() id: any;

    threads: CommentThread[] = [];

    loading = false;

    sending = false;

    draft = "";

    // thread head the draft answers
    replyTo?: RecordComment;

    constructor(private dataService: DataService) {
    }

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading = true;
        this.dataService.commentList(this.eruptName, this.id).subscribe({
            next: res => {
                this.loading = false;
                if (res.success) this.group(res.data || []);
            },
            error: () => this.loading = false
        });
    }

    private group(comments: RecordComment[]) {
        const heads = new Map<number, CommentThread>();
        comments.filter(c => !c.parentId).forEach(c => heads.set(c.id, {head: c, replies: []}));
        comments.filter(c => c.parentId).forEach(c => heads.get(c.parentId)?.replies.push(c));
        this.threads = [...heads.values()];
    }

    reply(comment: RecordComment) {
        this.replyTo = comment;
    }

    onKeydown(e: KeyboardEvent) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            this.send();
        }
    }

    send() {
        const content = this.draft.trim();
        if (!content || this.sending) return;
        this.sending = true;
        this.dataService.commentAdd(this.eruptName, this.id, content, this.replyTo?.id).subscribe({
            next: res => {
                this.sending = false;
                if (!res.success) return;
                this.draft = "";
                this.replyTo = undefined;
                this.load();
            },
            error: () => this.sending = false
        });
    }

    remove(comment: RecordComment) {
        this.dataService.commentDelete(this.eruptName, this.id, comment.id).subscribe(res => {
            if (res.success) this.load();
        });
    }

    initial(name?: string): string {
        return (name || "?").trim().charAt(0).toUpperCase();
    }

}
