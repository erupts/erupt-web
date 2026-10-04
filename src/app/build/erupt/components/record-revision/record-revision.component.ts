import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from "@core";
import {FieldChange, RecordRevision} from "../../model/record-revision.model";

// avatar hues for operators without a picture, picked by a hash of the name
const AVATAR_COLORS = ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae", "#1677ff", "#eb2f96", "#52c41a", "#fa541c"];

/**
 * Change history of one record (erupt-revision module): a vertical timeline, newest first, one
 * entry per add / update / delete with the fields it touched as "before → after" rows. An update
 * entry offers a rollback, which puts its old values back through the regular save pipeline.
 * Opened in a drawer from the table row or the record panel.
 */
@Component({
    standalone: false,
    selector: "erupt-record-revision",
    templateUrl: "./record-revision.component.html",
    styleUrls: ["./record-revision.component.less"]
})
export class RecordRevisionComponent implements OnInit {

    @Input() eruptName: string;

    @Input() id: any;

    // whether the model allows editing, which a rollback is
    @Input() canRollback = false;

    // a rollback changed the record; the opener re-queries its data (callback form for drawer params)
    @Output() rolledBack = new EventEmitter<void>();

    @Input() onRolledBack?: () => void;

    revisions: RecordRevision[] = [];

    // true until the first list response, drives the skeleton
    initializing = true;

    // id of the revision being rolled back, for the button spinner
    rollingBack?: number;

    constructor(private dataService: DataService,
                private msg: NzMessageService,
                private i18n: I18NService) {
    }

    ngOnInit() {
        this.load();
    }

    load() {
        this.dataService.revisionList(this.eruptName, this.id).subscribe(res => {
            this.initializing = false;
            this.revisions = res.success ? (res.data || []) : [];
        }, () => this.initializing = false);
    }

    rollback(r: RecordRevision) {
        this.rollingBack = r.id;
        this.dataService.revisionRollback(this.eruptName, this.id, r.id).subscribe(res => {
            this.rollingBack = undefined;
            if (!res.success) return;
            this.msg.success(this.i18n.fanyi("global.update.success"));
            this.rolledBack.emit();
            this.onRolledBack?.();
            this.load();
        }, () => this.rollingBack = undefined);
    }

    // short text for a side of a change: references by their label, lists joined, empty as a dash
    display(value: any): string {
        if (value === null || value === undefined || value === "") return "—";
        if (Array.isArray(value)) return value.length ? value.map(v => this.display(v)).join(", ") : "—";
        if (typeof value === "object") {
            const label = value.label ?? value.name ?? value.title ?? value.id;
            return label !== undefined && label !== null ? String(label) : JSON.stringify(value);
        }
        if (typeof value === "boolean") return this.i18n.fanyi(value ? "Y" : "N");
        return String(value);
    }

    isEmpty(value: any): boolean {
        return value === null || value === undefined || value === "";
    }

    changesOf(r: RecordRevision): FieldChange[] {
        return r.changes || [];
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
