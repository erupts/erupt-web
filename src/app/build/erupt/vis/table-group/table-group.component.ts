import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {STChange, STColumn} from "@delon/abc/st";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Vis} from "../../model/erupt.model";
import {EditType} from "../../model/erupt.enum";
import {ReferenceTableType, ReferenceTreeType, Statistic, VL} from "../../model/erupt-field.model";
import {UiBuildService} from "../../service/ui-build.service";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";

/**
 * One value of the group field with the rows that carry it.
 */
export interface TableGroup {
    key: any;
    label: string;
    color?: string;
    rows: any[];
    expanded: boolean;
    // "Title: value" chips, one per column that declares a statistic
    stats: StatChip[];
}

export interface StatChip {
    title: string;
    value: string;
}

/**
 * The host table split into collapsible sections by `tableView.groupField`. Every
 * section is its own st using the host's columns (operations and formats included,
 * selection columns dropped); column statistics are summed per group in the section
 * header and over everything in the footer bar.
 */
@Component({
    standalone: false,
    selector: 'vis-table-group',
    templateUrl: './table-group.component.html',
    styleUrls: ['./table-group.component.less']
})
export class TableGroupComponent implements OnChanges, OnDestroy {

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() data: any[] = [];
    @Input() vis: Vis;
    // the fully built st columns of the host table (operations, formats, statistical included)
    @Input() columns: STColumn[] = [];
    @Input() loading: boolean = false;
    // st change events of every group table, forwarded to the host's tableDataChange
    @Output() change = new EventEmitter<STChange>();

    groups: TableGroup[] = [];
    groupColumns: STColumn[] = [];
    totalStats: StatChip[] = [];

    // columns with a statistic; the host column keeps it, the group copy does not
    private statColumns: STColumn[] = [];

    // expansion survives a data refresh so a reload does not reset what the user opened
    private expandedState = new Map<string, boolean>();

    constructor(private dataService: DataService, private i18n: I18NService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['columns']) {
            this.buildColumns();
        }
        if (changes['data'] || changes['vis'] || changes['columns'] || changes['eruptBuildModel']) {
            this.build();
        }
    }

    private buildColumns() {
        this.statColumns = (this.columns || []).filter(c => !!c[UiBuildService.STATISTIC_KEY]);
        this.groupColumns = (this.columns || []).filter(c => c.type !== 'checkbox' && c.type !== 'radio');
    }

    private build(fetchedChoiceItems?: VL[]) {
        if (!this.eruptBuildModel || !this.vis?.tableView?.groupField) return;
        const groupField = this.vis.tableView.groupField;
        const edit = this.eruptBuildModel.eruptModel.eruptFieldModelMap?.get(groupField as unknown as String)?.eruptFieldJson?.edit;

        if (edit?.type === EditType.CHOICE && !fetchedChoiceItems && !edit.choiceType?.items?.length) {
            this.dataService.findChoiceItem(this.eruptBuildModel.eruptModel.eruptName, groupField)
                .subscribe(vls => this.build(vls));
            return;
        }

        const choiceItems: VL[] = fetchedChoiceItems ?? (edit?.type === EditType.CHOICE ? (edit.choiceType?.items ?? []) : []);
        const refTable: ReferenceTableType | undefined = edit?.type === EditType.REFERENCE_TABLE ? edit.referenceTableType : undefined;
        const refTree: ReferenceTreeType | undefined = edit?.type === EditType.REFERENCE_TREE ? edit.referenceTreeType : undefined;
        const idField = refTable?.id ?? refTree?.id;
        const labelField = refTable?.label ?? refTree?.label;
        const rows = this.data || [];

        // the grouping key of a row: reference id, or the stored value (a choice row holds the value, not its label)
        const keyOf = (row: any) => {
            const val = row[groupField];
            return idField ? (val?.[idField] ?? null) : (val ?? null);
        };
        const choiceLabel = new Map<string, string>(choiceItems.map(vl => [String(vl.value), vl.label]));

        const defs: { key: any; label: string; color?: string }[] = [];
        const seen = new Set<string>();
        const register = (key: any, label: string, color?: string) => {
            const k = key == null ? '__null__' : String(key);
            if (!seen.has(k)) {
                seen.add(k);
                defs.push({key, label, color});
            }
        };
        // declared choice order first, then whatever the data brings
        choiceItems.forEach(vl => register(vl.value, vl.label, vl.color));
        for (const row of rows) {
            const key = keyOf(row);
            const label = key == null ? this.i18n.fanyi('group.unset')
                : idField ? (row[groupField]?.[labelField] ?? String(key)) : (choiceLabel.get(String(key)) ?? String(key));
            register(key, label);
        }

        const collapsed = !!this.vis.tableView.collapsed;
        this.groups = defs.map(def => {
            const k = def.key == null ? '__null__' : String(def.key);
            const groupRows = rows.filter(row => keyOf(row) == def.key);
            return {
                ...def,
                rows: groupRows,
                expanded: this.expandedState.get(k) ?? !collapsed,
                stats: this.stats(groupRows)
            };
        }).filter(g => g.rows.length > 0);
        this.totalStats = this.stats(rows);
        this.mountProgressively();
    }

    // How many group tables are mounted so far. Every st is a heavy component, so after a
    // (re)build the headers show at once and the tables follow a few per frame instead of
    // blocking the page while all of them initialize together.
    mounted = 0;

    protected readonly Math = Math;

    private mountHandle: ReturnType<typeof setTimeout> | null = null;

    // timers rather than animation frames: a frame never comes while the tab is hidden, and a
    // hidden tab throttles timers too, so there everything mounts at once; nobody is watching
    private mountProgressively() {
        if (this.mountHandle) clearTimeout(this.mountHandle);
        if (document.hidden) {
            this.mounted = this.groups.length;
            return;
        }
        this.mounted = 0;
        const step = () => {
            this.mounted = Math.min(this.groups.length, this.mounted + TableGroupComponent.MOUNT_PER_FRAME);
            this.mountHandle = this.mounted < this.groups.length ? setTimeout(step, 16) : null;
        };
        this.mountHandle = setTimeout(step);
    }

    private static readonly MOUNT_PER_FRAME = 2;

    ngOnDestroy() {
        if (this.mountHandle) clearTimeout(this.mountHandle);
    }

    private stats(rows: any[]): StatChip[] {
        return this.statColumns.map(col => ({
            title: typeof col.title === 'string' ? col.title : (col.title as any)?.text ?? '',
            value: this.aggregate(col, rows)
        }));
    }

    // the @View.statistic of a column computed over one group's rows; the server does the
    // same over the whole result for the plain table footer
    private aggregate(col: STColumn, rows: any[]): string {
        const index = Array.isArray(col.index) ? col.index[0] : col.index as string;
        const statistic: Statistic = col[UiBuildService.STATISTIC_KEY];
        const values = rows.map(r => r[index]).filter(v => v != null && v !== '');
        const nums = values.map(v => Number(v)).filter(v => !isNaN(v));
        const fmt = (n: number) => n.toLocaleString(undefined, {maximumFractionDigits: 2});
        switch (statistic) {
            case Statistic.COUNT:
                return String(values.length);
            case Statistic.DISTINCT_COUNT:
                return String(new Set(values.map(v => String(v))).size);
            case Statistic.SUM:
                return fmt(nums.reduce((a, b) => a + b, 0));
            case Statistic.AVG:
                return nums.length ? fmt(nums.reduce((a, b) => a + b, 0) / nums.length) : '-';
            case Statistic.MAX:
                return nums.length ? fmt(Math.max(...nums)) : '-';
            case Statistic.MIN:
                return nums.length ? fmt(Math.min(...nums)) : '-';
            default:
                return '-';
        }
    }

    // a resize only widens the column in the group it happened in; nothing is synced or saved
    onChange(event: STChange) {
        if (event.type === 'resize') return;
        this.change.emit(event);
    }

    toggle(group: TableGroup) {
        group.expanded = !group.expanded;
        if (group.expanded) this.mounted = this.groups.length;
        this.expandedState.set(group.key == null ? '__null__' : String(group.key), group.expanded);
    }

    setAll(expanded: boolean) {
        if (expanded) this.mounted = this.groups.length;
        for (const group of this.groups) {
            group.expanded = expanded;
            this.expandedState.set(group.key == null ? '__null__' : String(group.key), expanded);
        }
    }

    get total(): number {
        return (this.data || []).length;
    }

}
