import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {FieldVisibility, Vis} from "../../model/erupt.model";
import {EditType} from "../../model/erupt.enum";
import {ReferenceTableType, ReferenceTreeType, VL} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {UiBuildService} from "../../service/ui-build.service";
import {STColumn} from "@delon/abc/st";
import {I18NService} from "@core";

/**
 * One distinct value of a grouping field: the raw value written back on drop, the
 * label shown in the header. `byLabel` is true for CHOICE fields, whose rows carry
 * the label rather than the value.
 */
interface GroupDef {
    key: any;
    label: string;
    color?: string;
    byLabel?: boolean;
}

export interface BoardColumn extends GroupDef {
    id: string;
    items: any[];
    sum: number;
}

export interface BoardLane extends GroupDef {
    columns: BoardColumn[];
    count: number;
}

/**
 * The resolved grouping of one field: how a row is read into a group and the ordered
 * list of groups (declared choice order, or first-seen order of the data).
 */
interface Grouping {
    defs: GroupDef[];
    // what a row exposes for this field: id for references, label for choices, raw otherwise
    rowValue: (row: any) => any;
    // whether rows with a value outside the declared groups get an extra "unset" group
    catchUnset: boolean;
}

@Component({
    standalone: false,
    selector: 'vis-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.less']
})
export class BoardComponent implements OnInit, OnChanges {

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() data: any[] = [];
    @Input() vis: Vis;
    @Output() onEdit = new EventEmitter<any>();

    lanes: BoardLane[] = [];
    // every drop list on the board, so a card can travel across lanes as well as columns
    columnIds: string[] = [];
    columnMap: Map<any, STColumn> = new Map();

    private choiceCache = new Map<string, VL[]>();

    constructor(private dataService: DataService, private uiBuildService: UiBuildService, private i18n: I18NService) {
    }

    ngOnInit() {
        this.build();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] || changes['vis']) {
            this.build();
        }
    }

    get hasSwimlanes(): boolean {
        return !!this.vis?.boardView?.swimlaneField;
    }

    private build() {
        if (!this.eruptBuildModel || !this.vis?.boardView) return;
        const {groupField, swimlaneField, sumField} = this.vis.boardView;

        this.columnMap = new Map();
        for (const col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(String(col.index), col);
        }

        // CHOICE fields without inline items are fetched once, then the board is rebuilt
        for (const field of [groupField, swimlaneField]) {
            if (field && this.needsChoiceFetch(field)) {
                this.dataService.findChoiceItem(this.eruptBuildModel.eruptModel.eruptName, field)
                    .subscribe(vls => {
                        this.choiceCache.set(field, vls);
                        this.build();
                    });
                return;
            }
        }

        const rows = this.data || [];
        const columnGrouping = this.grouping(groupField);
        // without swimlanes the board is a single untitled lane holding every row
        const laneDefs: GroupDef[] = swimlaneField ? this.split(rows, this.grouping(swimlaneField)) : [{key: null, label: ''}];
        const laneRows: any[][] = swimlaneField ? this.bucketInto(rows, this.grouping(swimlaneField)) : [rows];

        this.columnIds = [];
        this.lanes = laneDefs.map((laneDef, li) => {
            const defs = this.split(laneRows[li], columnGrouping);
            const columns = this.bucketInto(laneRows[li], columnGrouping).map((items, ci) => {
                const id = `board-col-${li}-${ci}`;
                this.columnIds.push(id);
                return {
                    ...defs[ci], id, items,
                    sum: sumField ? items.reduce((acc, r) => acc + (Number(r[sumField]) || 0), 0) : 0
                };
            });
            return {...laneDef, columns, count: laneRows[li].length};
        });
    }

    private needsChoiceFetch(field: string): boolean {
        const edit = this.eruptBuildModel.eruptModel.eruptFieldModelMap?.get(field as unknown as String)?.eruptFieldJson?.edit;
        return edit?.type === EditType.CHOICE && !edit.choiceType?.items?.length && !this.choiceCache.has(field);
    }

    /**
     * Resolve how a field groups rows: declared choice items keep their order and color,
     * references are keyed by id and labelled by their label field, anything else by value.
     */
    private grouping(field: string): Grouping {
        const edit = this.eruptBuildModel.eruptModel.eruptFieldModelMap?.get(field as unknown as String)?.eruptFieldJson?.edit;
        const choiceItems: VL[] = edit?.type === EditType.CHOICE
            ? (this.choiceCache.get(field) ?? edit.choiceType?.items ?? []) : [];
        if (choiceItems.length) {
            return {
                defs: choiceItems.map(vl => ({key: vl.value, label: vl.label, color: vl.color, byLabel: true})),
                rowValue: row => row[field],
                catchUnset: true
            };
        }
        const refTable: ReferenceTableType | undefined = edit?.type === EditType.REFERENCE_TABLE ? edit.referenceTableType : undefined;
        const refTree: ReferenceTreeType | undefined = edit?.type === EditType.REFERENCE_TREE ? edit.referenceTreeType : undefined;
        if (refTable || refTree) {
            const idField = (refTable?.id ?? refTree!.id)!;
            const labelField = (refTable?.label ?? refTree!.label)!;
            return {
                defs: this.distinct(row => row[field]?.[idField] ?? null, row => row[field]?.[labelField]),
                rowValue: row => row[field]?.[idField] ?? null,
                catchUnset: false
            };
        }
        return {
            defs: this.distinct(row => row[field] ?? null, row => row[field]),
            rowValue: row => row[field] ?? null,
            catchUnset: false
        };
    }

    // groups in first-seen order of the data; a null value becomes the "unset" group
    private distinct(keyOf: (row: any) => any, labelOf: (row: any) => any): GroupDef[] {
        const seen = new Map<string, GroupDef>();
        for (const row of (this.data || [])) {
            const key = keyOf(row);
            const k = key == null ? '__null__' : String(key);
            if (!seen.has(k)) {
                seen.set(k, {key, label: key == null ? this.i18n.fanyi('board.unset') : String(labelOf(row) ?? key)});
            }
        }
        return [...seen.values()];
    }

    /**
     * The groups of a row set: every declared group, plus an "unset" group when rows fall
     * outside the declared ones (CHOICE) — mirrors bucketInto so indexes line up.
     */
    private split(rows: any[], g: Grouping): GroupDef[] {
        const defs = [...g.defs];
        if (g.catchUnset && rows.some(row => !this.matches(g, defs, row))) {
            defs.push({key: null, label: this.i18n.fanyi('board.unset')});
        }
        return defs;
    }

    private bucketInto(rows: any[], g: Grouping): any[][] {
        const defs = this.split(rows, g);
        return defs.map(def => rows.filter(row => {
            if (def.key === null && g.catchUnset && !g.defs.includes(def)) {
                return !this.matches(g, g.defs, row);
            }
            return this.hit(def, g.rowValue(row));
        }));
    }

    private matches(g: Grouping, defs: GroupDef[], row: any): boolean {
        const val = g.rowValue(row);
        return defs.some(def => this.hit(def, val));
    }

    // rows carry the stored choice value; the label is accepted too for sources that resolve it
    private hit(def: GroupDef, val: any): boolean {
        return val == def.key || (def.byLabel && val == def.label);
    }

    overWip(col: BoardColumn): boolean {
        const limit = this.vis.boardView.wipLimit;
        return limit > 0 && col.items.length > limit;
    }

    wipTip(): string {
        return this.i18n.fanyi('board.wip_over') + ' ' + this.vis.boardView.wipLimit;
    }

    formatSum(value: number): string {
        return value.toLocaleString(undefined, {maximumFractionDigits: 2});
    }

    drop(event: CdkDragDrop<any[]>, lane: BoardLane, targetCol: BoardColumn) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            return;
        }
        const item = event.previousContainer.data[event.previousIndex];
        const sourceLane = this.lanes.find(l => l.columns.some(c => c.id === event.previousContainer.id));
        const sourceCol = sourceLane?.columns.find(c => c.id === event.previousContainer.id);
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        this.recount(sourceLane, sourceCol, item, -1);
        this.recount(lane, targetCol, item, 1);
        const pk = item[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
        const laneChanged = this.hasSwimlanes && sourceLane !== lane;
        this.dataService.updateBoardGroup(
            this.eruptBuildModel.eruptModel.eruptName,
            this.vis.code,
            pk,
            targetCol.key,
            laneChanged ? {value: lane.key} : undefined
        ).subscribe({
            error: () => {
                transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
                this.recount(lane, targetCol, item, -1);
                this.recount(sourceLane, sourceCol, item, 1);
            }
        });
    }

    // keep lane counts and column sums in step with a moved card without a full rebuild
    private recount(lane: BoardLane | undefined, col: BoardColumn | undefined, item: any, delta: 1 | -1) {
        if (!lane || !col) return;
        lane.count += delta;
        const sumField = this.vis.boardView.sumField;
        if (sumField) col.sum += delta * (Number(item[sumField]) || 0);
    }

    protected readonly FieldVisibility = FieldVisibility;
}
