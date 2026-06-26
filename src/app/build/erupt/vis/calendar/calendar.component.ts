import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {CalendarView, Vis} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {UiBuildService} from "../../service/ui-build.service";
import {STColumn} from "@delon/abc/st";
import moment from 'moment';

@Component({
    standalone: false,
    selector: 'vis-calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.less']
})
export class CalendarComponent implements OnChanges {

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() data: any[] = [];
    @Input() vis: Vis;
    @Output() onEdit = new EventEmitter<any>();

    dateMap = new Map<string, any[]>();
    columnMap = new Map<any, STColumn>();

    constructor(private dataService: DataService, private uiBuildService: UiBuildService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] || changes['vis'] || changes['eruptBuildModel']) {
            this.build();
        }
    }

    private build() {
        if (!this.eruptBuildModel || !this.vis?.calendarView) return;
        this.columnMap = new Map();
        for (const col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(col.index, col);
        }
        this.buildDateMap();
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
                const key = cur.format('YYYY-MM-DD');
                if (!this.dateMap.has(key)) this.dateMap.set(key, []);
                this.dateMap.get(key).push(row);
                cur.add(1, 'day');
            }
        }
    }

    getEventsForDate(date: Date): any[] {
        return this.dateMap.get(moment(date).format('YYYY-MM-DD')) ?? [];
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

    getPk(row: any): any {
        return row[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
    }
}
