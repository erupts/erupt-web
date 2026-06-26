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

export interface BoardColumn {
    key: any;
    label: string;
    color?: string;
    items: any[];
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

    columns: BoardColumn[] = [];
    columnIds: string[] = [];
    columnMap: Map<any, STColumn> = new Map();

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

    private build(fetchedChoiceItems?: VL[]) {
        if (!this.eruptBuildModel || !this.vis?.boardView) return;
        const groupField = this.vis.boardView.groupField;

        this.columnMap = new Map();
        for (const col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(col.index, col);
        }

        const edit = this.eruptBuildModel.eruptModel.eruptFieldModelMap?.get(groupField as unknown as String)?.eruptFieldJson?.edit;

        if (edit?.type === EditType.CHOICE && !fetchedChoiceItems && !edit.choiceType?.items?.length) {
            this.dataService.findChoiceItem(this.eruptBuildModel.eruptModel.eruptName, groupField as unknown as string)
                .subscribe(vls => this.build(vls));
            return;
        }

        const choiceItems: VL[] = fetchedChoiceItems ?? (edit?.type === EditType.CHOICE ? (edit.choiceType?.items ?? []) : []);
        const refTable: ReferenceTableType | undefined = edit?.type === EditType.REFERENCE_TABLE ? edit.referenceTableType : undefined;
        const refTree: ReferenceTreeType | undefined = edit?.type === EditType.REFERENCE_TREE ? edit.referenceTreeType : undefined;

        let colDefs: { key: any; label: string; color?: string }[];

        if (choiceItems.length) {
            colDefs = choiceItems.map(vl => ({key: vl.value, label: vl.label, color: vl.color}));
        } else if (refTable || refTree) {
            const idField = (refTable?.id ?? refTree!.id)!;
            const labelField = (refTable?.label ?? refTree!.label)!;
            const seen = new Set<string>();
            colDefs = [];
            for (const row of (this.data || [])) {
                const ref = row[groupField];
                const id = ref?.[idField] ?? null;
                const k = id == null ? '__null__' : String(id);
                if (!seen.has(k)) {
                    seen.add(k);
                    colDefs.push({key: id, label: id == null ? '—' : (ref?.[labelField] ?? String(id))});
                }
            }
        } else {
            const seen = new Set<string>();
            colDefs = [];
            for (const row of (this.data || [])) {
                const val = row[groupField];
                const k = val == null ? '__null__' : String(val);
                if (!seen.has(k)) {
                    seen.add(k);
                    colDefs.push({key: val, label: val == null ? '—' : String(val)});
                }
            }
        }

        const idField = refTable?.id ?? refTree?.id;
        this.columns = colDefs.map(def => ({
            ...def,
            items: (this.data || []).filter(row => {
                const val = idField ? row[groupField]?.[idField] : row[groupField];
                return choiceItems.length ? val == def.label : val == def.key;
            })
        }));

        if (choiceItems.length) {
            const matchedLabels = new Set(choiceItems.map(vl => vl.label));
            const unmatched = (this.data || []).filter(row => {
                const val = row[groupField];
                return val == null || !matchedLabels.has(val);
            });
            if (unmatched.length) {
                this.columns.push({key: null, label: this.i18n.fanyi('board.unset'), items: unmatched});
            }
        }

        this.columnIds = this.columns.map((_, i) => 'board-col-' + i);
    }

    drop(event: CdkDragDrop<any[]>, targetCol: BoardColumn) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            return;
        }
        const item = event.previousContainer.data[event.previousIndex];
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        const pk = item[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
        this.dataService.updateBoardGroup(
            this.eruptBuildModel.eruptModel.eruptName,
            this.vis.code,
            pk,
            targetCol.key
        ).subscribe({
            error: () => transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex)
        });
    }

    protected readonly FieldVisibility = FieldVisibility;
}
