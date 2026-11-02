import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {CalendarMode, CalendarView, FieldVisibility, Vis} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {UiBuildService} from "../../service/ui-build.service";
import {STColumn} from "@delon/abc/st";
import {I18NService} from "@core";
import moment from 'moment';

const DAY_KEY = 'YYYY-MM-DD';

/**
 * One day column of the week view / one cell of the month view.
 */
/**
 * One cell of a year-view mini month; `heat` is the event count relative to the busiest day.
 */
interface YearDay {
    key: string;
    day: number;
    inMonth: boolean;
    today: boolean;
    count: number;
    color: string | null;
    heat?: number;
}

interface YearMonth {
    key: string;
    label: string;
    date: Date;
    count: number;
    days: YearDay[];
}

interface DayCell {
    key: string;
    date: Date;
    today: boolean;
}

@Component({
    standalone: false,
    selector: 'vis-calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.less']
})
export class CalendarComponent implements OnChanges {

    // events shown per month cell before the "+N" toggle
    static readonly MONTH_CELL_LIMIT = 3;

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() data: any[] = [];
    @Input() vis: Vis;
    @Output() onEdit = new EventEmitter<any>();

    mode: CalendarMode = CalendarMode.MONTH;
    modeOptions: { label: string; value: CalendarMode }[] = [];

    // the day the views are anchored to; month/week views show the period containing it
    current: Date = new Date();

    dateMap = new Map<string, any[]>();
    columnMap = new Map<any, STColumn>();

    // week view columns, rebuilt whenever `current` moves
    weekDays: DayCell[] = [];

    // year view: twelve mini months of the year `current` falls in
    yearMonths: YearMonth[] = [];

    // month cells whose "+N" toggle was opened
    expandedCells = new Set<string>();

    protected readonly CalendarMode = CalendarMode;
    protected readonly FieldVisibility = FieldVisibility;
    protected readonly cellLimit = CalendarComponent.MONTH_CELL_LIMIT;

    constructor(private dataService: DataService, private uiBuildService: UiBuildService, private i18n: I18NService) {
        this.modeOptions = [
            {label: this.i18n.fanyi('calendar.month'), value: CalendarMode.MONTH},
            {label: this.i18n.fanyi('calendar.week'), value: CalendarMode.WEEK},
            {label: this.i18n.fanyi('calendar.year'), value: CalendarMode.YEAR},
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['vis'] && this.vis?.calendarView?.mode) {
            this.mode = this.vis.calendarView.mode;
        }
        if (changes['data'] || changes['vis'] || changes['eruptBuildModel']) {
            this.build();
        }
    }

    private build() {
        if (!this.eruptBuildModel || !this.vis?.calendarView) return;
        this.columnMap = new Map();
        for (const col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(String(col.index), col);
        }
        this.buildDateMap();
        this.buildWeek();
        this.buildYear();
    }

    private buildDateMap() {
        const cv: CalendarView = this.vis.calendarView;
        this.dateMap.clear();
        for (const row of this.data || []) {
            const startVal = row[cv.dateField];
            if (!startVal) continue;
            const start = moment(startVal).startOf('day');
            const endVal = cv.endDateField ? row[cv.endDateField] : null;
            const end = endVal ? moment(endVal).startOf('day') : start.clone();
            const cur = start.clone();
            while (cur.isSameOrBefore(end, 'day')) {
                const key = cur.format(DAY_KEY);
                if (!this.dateMap.has(key)) this.dateMap.set(key, []);
                this.dateMap.get(key).push(row);
                cur.add(1, 'day');
            }
        }
    }

    private buildWeek() {
        const start = moment(this.current).startOf('week');
        const todayKey = moment().format(DAY_KEY);
        this.weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = start.clone().add(i, 'day');
            const key = d.format(DAY_KEY);
            this.weekDays.push({key, date: d.toDate(), today: key === todayKey});
        }
    }

    private buildYear() {
        const year = moment(this.current).startOf('year');
        const todayKey = moment().format(DAY_KEY);
        let max = 0;
        this.yearMonths = [];
        for (let m = 0; m < 12; m++) {
            const first = year.clone().add(m, 'month');
            const start = first.clone().startOf('week');
            const days: YearDay[] = [];
            let count = 0;
            // six rows of seven days always cover a month, whatever weekday it starts on
            for (let i = 0; i < 42; i++) {
                const d = start.clone().add(i, 'day');
                const key = d.format(DAY_KEY);
                const events = d.month() === first.month() ? this.eventsOf(key) : [];
                count += events.length;
                max = Math.max(max, events.length);
                days.push({key, day: d.date(), inMonth: d.month() === first.month(), today: key === todayKey, count: events.length, color: events.length ? this.getEventColor(events[0]) : null});
            }
            this.yearMonths.push({key: first.format('YYYY-MM'), label: first.format('MMM'), date: first.toDate(), count, days});
        }
        // heat is relative to the busiest day of the year
        for (const month of this.yearMonths) for (const day of month.days) day.heat = max ? day.count / max : 0;
    }

    // year view: a day cell or a month title opens that month
    openMonth(date: Date) {
        this.current = date;
        this.mode = CalendarMode.MONTH;
        this.buildWeek();
    }

    // ── toolbar ─────────────────────────────────────────────────────────

    setMode(mode: CalendarMode) {
        this.mode = mode;
    }

    shift(step: number) {
        const unit = this.mode === CalendarMode.MONTH ? 'month' : this.mode === CalendarMode.WEEK ? 'week' : 'year';
        this.current = moment(this.current).add(step, unit).toDate();
        this.buildWeek();
        this.buildYear();
    }

    today() {
        this.current = new Date();
        this.buildWeek();
        this.buildYear();
    }

    // nz-calendar moves `current` itself when a cell is clicked or the panel changes
    onCurrentChange(date: Date) {
        this.current = date;
        this.buildWeek();
        this.buildYear();
    }

    periodLabel(): string {
        const m = moment(this.current);
        switch (this.mode) {
            case CalendarMode.MONTH:
                return m.format('YYYY-MM');
            case CalendarMode.WEEK: {
                const s = m.clone().startOf('week');
                const e = m.clone().endOf('week');
                return s.format(DAY_KEY) + ' ~ ' + e.format(DAY_KEY);
            }
            default:
                return m.format('YYYY');
        }
    }

    // ── event lookup ─────────────────────────────────────────────────────

    dayKey(date: Date): string {
        return moment(date).format(DAY_KEY);
    }

    dateOf(key: string): Date {
        return moment(key, DAY_KEY).toDate();
    }

    eventsOf(key: string): any[] {
        return this.dateMap.get(key) ?? [];
    }

    getEventsForDate(date: Date): any[] {
        return this.eventsOf(this.dayKey(date));
    }

    // month cell: the first few events, or all of them once expanded
    visibleEvents(key: string): any[] {
        const events = this.eventsOf(key);
        return this.expandedCells.has(key) || events.length <= this.cellLimit ? events : events.slice(0, this.cellLimit);
    }

    toggleCell(key: string, e: MouseEvent) {
        e.stopPropagation();
        this.expandedCells.has(key) ? this.expandedCells.delete(key) : this.expandedCells.add(key);
    }

    getEventColor(row: any): string {
        const f = this.vis.calendarView.colorField;
        return (f && row[f]) ? row[f] : '#1890ff';
    }

    getEventLabel(row: any): string {
        for (const field of this.eruptBuildModel.eruptModel.eruptFieldModels) {
            const views = field.eruptFieldJson.views;
            if (!views?.length) continue;
            const col = views[0].column;
            const fmt = this.columnMap.get(field.fieldName)?.format;
            return fmt ? (fmt(row, this.columnMap.get(field.fieldName), null) ?? '') : (row[col] ?? '');
        }
        return '';
    }


    fieldVisible(column: string): boolean {
        const fields = this.vis.fields || [];
        return this.vis.fieldVisibility == FieldVisibility.EXCLUDE ? fields.indexOf(column) === -1 : fields.indexOf(column) !== -1;
    }

    getPk(row: any): any {
        return row[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
    }

    // ── drag & drop ──────────────────────────────────────────────────────

    // Both lists carry their day key as data; the dragged item is the row itself.
    drop(event: CdkDragDrop<string>) {
        const fromKey: string = event.previousContainer.data;
        const toKey: string = event.container.data;
        if (fromKey === toKey) return;
        const row = event.item.data;
        const delta = moment(toKey, DAY_KEY).diff(moment(fromKey, DAY_KEY), 'day');
        this.moveRow(row, delta);
    }

    private moveRow(row: any, deltaDays: number) {
        const cv = this.vis.calendarView;
        const before = {start: row[cv.dateField], end: cv.endDateField ? row[cv.endDateField] : undefined};
        const start = this.shiftValue(before.start, deltaDays);
        const end = before.end ? this.shiftValue(before.end, deltaDays) : undefined;
        row[cv.dateField] = start;
        if (cv.endDateField && before.end) row[cv.endDateField] = end;
        this.buildDateMap();
        this.dataService.updateCalendarDate(
            this.eruptBuildModel.eruptModel.eruptName, this.vis.code, this.getPk(row), start, end
        ).subscribe({
            error: () => {
                row[cv.dateField] = before.start;
                if (cv.endDateField && before.end) row[cv.endDateField] = before.end;
                this.buildDateMap();
            }
        });
    }

    // keep the precision of the stored value: a date stays a date, a datetime keeps its time of day
    private shiftValue(value: any, deltaDays: number): string {
        const text = String(value);
        const hasTime = /\d{1,2}:\d{2}/.test(text);
        const m = moment(value).add(deltaDays, 'day');
        return hasTime ? m.format('YYYY-MM-DD HH:mm:ss') : m.format(DAY_KEY);
    }

}
