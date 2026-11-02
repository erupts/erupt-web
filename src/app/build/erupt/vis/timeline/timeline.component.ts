import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {STColumn} from "@delon/abc/st";
import moment from 'moment';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {FieldVisibility, TimelineMode, Vis} from "../../model/erupt.model";
import {View} from "../../model/erupt-field.model";
import {UiBuildService} from "../../service/ui-build.service";

/**
 * One rendered field of an entry: the view title and the formatted cell HTML.
 */
interface TimelineField {
    title: string;
    html: string;
}

/**
 * One row of the list laid out on the timeline.
 */
interface TimelineEntry {
    pk: any;
    row: any;
    // moment of the date field, null when the row has no date
    time: moment.Moment | null;
    label: string;
    color: string;
    title: string;
    fields: TimelineField[];
}

/**
 * Entries of one calendar day, rendered under a day heading.
 */
interface TimelineDay {
    key: string;
    label: string;
    weekday: string;
    entries: TimelineEntry[];
}

const DEFAULT_COLOR = '#1890ff';

@Component({
    standalone: false,
    selector: 'vis-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.less']
})
export class TimelineComponent implements OnChanges {

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() data: any[] = [];
    @Input() vis: Vis;
    @Output() onEdit = new EventEmitter<any>();

    days: TimelineDay[] = [];

    nzMode: 'left' | 'alternate' | 'right' = 'left';

    private columnMap = new Map<string, STColumn>();

    constructor(private uiBuildService: UiBuildService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] || changes['vis'] || changes['eruptBuildModel']) {
            this.build();
        }
    }

    private build() {
        if (!this.eruptBuildModel || !this.vis?.timelineView) return;
        const tv = this.vis.timelineView;
        this.nzMode = tv.mode === TimelineMode.ALTERNATE ? 'alternate' : tv.mode === TimelineMode.RIGHT ? 'right' : 'left';

        this.columnMap = new Map();
        for (const col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(String(col.index), col);
        }

        const pkCol = this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
        const views = this.visibleViews();
        const entries: TimelineEntry[] = (this.data || []).map(row => {
            const raw = row[tv.dateField];
            const time = raw ? moment(raw) : null;
            const [titleView, ...rest] = views;
            return {
                pk: row[pkCol],
                row,
                time: time?.isValid() ? time : null,
                // the day is the section heading, so an entry only carries its time of day
                label: this.formatClock(raw, time),
                color: (tv.colorField && row[tv.colorField]) || DEFAULT_COLOR,
                title: titleView ? this.render(row, titleView) : '',
                fields: rest.map(v => ({title: v.title, html: this.render(row, v)})).filter(f => !!f.html)
            };
        });

        // rows without a date sink to the end whichever direction is chosen
        const dir = tv.descending ? -1 : 1;
        entries.sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return (a.time.valueOf() - b.time.valueOf()) * dir;
        });

        this.days = [];
        let current: TimelineDay | null = null;
        for (const entry of entries) {
            const key = entry.time ? entry.time.format('YYYY-MM-DD') : '';
            if (!current || current.key !== key) {
                current = {key, label: entry.time ? entry.time.format('YYYY-MM-DD') : '—', weekday: entry.time ? entry.time.format('dddd') : '', entries: []};
                this.days.push(current);
            }
            current.entries.push(entry);
        }
    }

    /**
     * Views of the model that this vis shows, minus the date field which is the axis label.
     */
    private visibleViews(): (View & { fieldName: string })[] {
        const result: (View & { fieldName: string })[] = [];
        const include = this.vis.fieldVisibility === FieldVisibility.INCLUDE;
        const fields = this.vis.fields || [];
        for (const field of this.eruptBuildModel.eruptModel.eruptFieldModels) {
            for (const view of field.eruptFieldJson.views || []) {
                if (view.column === this.vis.timelineView.dateField) continue;
                const listed = fields.indexOf(view.column) !== -1;
                if (include ? listed : !listed) {
                    result.push({...view, fieldName: field.fieldName});
                }
            }
        }
        return result;
    }

    private render(row: any, view: View & { fieldName: string }): string {
        const col = this.columnMap.get(view.fieldName);
        if (col?.format) {
            return col.format(row, col, null) ?? '';
        }
        const value = row[view.column];
        return value == null ? '' : String(value);
    }

    /**
     * The time of day of a date-time value; a plain date has none, the day heading says it all.
     */
    private formatClock(raw: any, time: moment.Moment | null): string {
        if (!time?.isValid()) return '';
        const hasTime = typeof raw === 'string' ? /\d{1,2}:\d{2}/.test(raw) : !!(time.hours() || time.minutes());
        return hasTime ? time.format('HH:mm') : '';
    }

    trackDay(_: number, day: TimelineDay) {
        return day.key;
    }

    trackEntry(_: number, entry: TimelineEntry) {
        return entry.pk;
    }

}
