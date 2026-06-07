import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {GanttDragEvent, GanttGroup, GanttItem, GanttItemType, GanttViewType, NgxGanttComponent} from "@worktile/gantt";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {FieldVisibility, Vis} from "../../model/erupt.model";
import moment from 'moment';
import {EruptField} from "../../model/erupt-field.model";
import {STColumn} from "@delon/abc/st";
import {UiBuildService} from "../../service/ui-build.service";
import {DataService} from "@shared/service/data.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {EditType, SelectMode} from "../../model/erupt.enum";

@Component({
    standalone: false,
    selector: 'vis-gantt',
    templateUrl: './gantt.component.html',
    styleUrls: ['./gantt.component.less']
})
export class GanttComponent implements OnChanges, OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() vis: Vis;

    @Input() selectionMode: SelectMode | null = null; // selection mode, null means default multi-select

    @Output() onEdit = new EventEmitter<any>();

    @Output() onUpdate = new EventEmitter<any>();

    @Output() onSelectionChange = new EventEmitter<any[]>();

    @ViewChild('gantt', {static: false}) ganttComponent: NgxGanttComponent;

    clientHeight: number = document.body.clientHeight;

    columnMap: Map<any, STColumn>;

    items: GanttItem[] = [];

    groups: GanttGroup[] = [];

    editColumnWidth: number = 0; // edit column width, dynamically calculated based on tree depth

    selectedItemIds: Set<string> = new Set<string>(); // stores the IDs of selected items

    protected readonly GanttViewType = GanttViewType;

    constructor(private uiBuildService: UiBuildService,
                private msg: NzMessageService,
                public dataService: DataService) {
    }

    ngOnInit(): void {
        this.columnMap = new Map<string, STColumn>()
        for (let col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(col.index, col);
        }
    }

    dragEnded(e: GanttDragEvent) {
        let start = moment(Number(e.item.start) * 1000).format('YYYY-MM-DD[T]00:00:00.SSS');
        let end = moment(Number(e.item.end) * 1000).format('YYYY-MM-DD[T]23:59:59.SSS');
        this.dataService.updateGanttDate(this.eruptBuildModel.eruptModel.eruptName, this.vis.code, e.item.id, start, end).subscribe(res => {
            for (let datum of this.data) {
                if (datum[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol] == e.item.id) {
                    datum[this.vis.ganttView.startDateField] = start;
                    datum[this.vis.ganttView.endDateField] = end;
                }
            }
        });
    }

    edit(item: GanttItem) {
        this.onEdit.emit(item.id)
    }

    /**
     * Toggle the selected state of an item
     * @param item Gantt chart item
     */
    toggleSelection(item: GanttItem, event?: Event): void {
        const itemId = item.id;

        // if in single-select mode
        if (this.selectionMode === SelectMode.radio) {
            if (this.selectedItemIds.has(itemId)) {
                this.selectedItemIds.delete(itemId);
            } else {
                // clear all selected items and select only the current item
                this.selectedItemIds.clear();
                this.selectedItemIds.add(itemId);
            }
        } else {
            // multi-select mode
            if (this.selectedItemIds.has(itemId)) {
                this.selectedItemIds.delete(itemId);
                // when deselecting, also deselect all child nodes
                this.unselectChildren(item);
            } else {
                this.selectedItemIds.add(itemId);
            }
        }
        this.emitSelectionChange();
    }

    /**
     * Handle radio button click event
     * @param item Gantt chart item
     * @param event click event
     */
    onRadioClick(item: GanttItem, event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.toggleSelection(item);
    }

    /**
     * Deselect all child nodes
     * @param item parent node
     */
    private unselectChildren(item: GanttItem): void {
        if (item.children && item.children.length > 0) {
            item.children.forEach(child => {
                this.selectedItemIds.delete(child.id);
                this.unselectChildren(child);
            });
        }
    }

    /**
     * Check whether an item is selected
     * @param item Gantt chart item
     * @returns whether the item is selected
     */
    isSelected(item: GanttItem): boolean {
        return this.selectedItemIds.has(item.id);
    }

    /**
     * Check whether all items (including child nodes) are selected
     * @returns whether all items are selected
     */
    isAllSelected(): boolean {
        const checkAllSelected = (items: GanttItem[]): boolean => {
            return items.every(item => {
                const itemSelected = this.selectedItemIds.has(item.id);
                if (item.children && item.children.length > 0) {
                    return itemSelected && checkAllSelected(item.children);
                }
                return itemSelected;
            });
        };
        return this.items.length > 0 && checkAllSelected(this.items);
    }

    /**
     * Check whether some items are partially selected (used to display the indeterminate state)
     * @returns whether there is a partial selection
     */
    isIndeterminate(): boolean {
        const hasSelected = (items: GanttItem[]): boolean => {
            return items.some(item => {
                const itemSelected = this.selectedItemIds.has(item.id);
                if (item.children && item.children.length > 0) {
                    return itemSelected || hasSelected(item.children);
                }
                return itemSelected;
            });
        };
        return hasSelected(this.items) && !this.isAllSelected();
    }

    /**
     * Select all / deselect all
     * @param checked whether to select
     */
    toggleSelectAll(checked: boolean): void {
        if (this.selectionMode === SelectMode.radio) {
            return;
        }
        const selectAllItems = (items: GanttItem[]) => {
            items.forEach(item => {
                if (checked) {
                    this.selectedItemIds.add(item.id);
                } else {
                    this.selectedItemIds.delete(item.id);
                }
                if (item.children && item.children.length > 0) {
                    selectAllItems(item.children);
                }
            });
        };
        selectAllItems(this.items);
        this.emitSelectionChange();
    }

    /**
     * Collect all selected row data and emit to the parent component
     */
    private emitSelectionChange(): void {
        const selectedRows: any[] = [];
        const collectSelectedRows = (items: GanttItem[]) => {
            items.forEach(item => {
                if (this.selectedItemIds.has(item.id) && item.origin) {
                    selectedRows.push(item.origin);
                }
                if (item.children && item.children.length > 0) {
                    collectSelectedRows(item.children);
                }
            });
        };
        collectSelectedRows(this.items);
        this.onSelectionChange.emit(selectedRows);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.convertDataToGanttItems();
            // clear selection state when data changes
            this.selectedItemIds.clear();
            this.emitSelectionChange();
        }
    }

    scrollToToday(): void {
        if (this.ganttComponent) {
            this.ganttComponent.scrollToToday();
            // this.ganttComponent.scrollToDate(new Date().getTime());
        }
    }

    scrollToDate(item: GanttItem): void {
        if (this.ganttComponent) {
            this.ganttComponent.scrollToDate(item.start || item.end);
        }
    }

    onViewChange() {
        this.convertDataToGanttItems();
        setTimeout(() => {
            this.scrollToToday();
        }, 100)
    }

    getEruptField(field: string): EruptField {
        return this.eruptBuildModel.eruptModel.eruptFieldModelMap.get(field).eruptFieldJson;
    }

    private convertDataToGanttItems(): void {
        if (!this.data || !this.data.length) {
            this.items = [];
            return;
        }
        const ganttView = this.vis.ganttView;
        if (ganttView.groupField) {
            ganttView.groupField = ganttView.groupField.replace(/\./g, '_');
            for (let d of this.data) {
                let group = this.groups.find(g => g.id == d[ganttView.groupField]);
                if (!group) {
                    group = {
                        id: d[ganttView.groupField],
                        title: d[ganttView.groupField] || 'No Group',
                    }
                    this.groups.push(group);
                }
            }
        } else {
            this.groups = []
        }
        const startDateField = ganttView.startDateField;
        const endDateField = ganttView.endDateField;
        const primaryKeyCol = this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
        const itemMap = new Map<string, GanttItem>();
        const allItems: GanttItem[] = [];

        this.data.forEach((row, index) => {
            const id = String(row[primaryKeyCol] || index);
            const start = this.parseDate(row[startDateField]);
            const end = this.parseDate(row[endDateField]);
            const item: GanttItem = {
                id: id,
                title: id,
                start: start,
                end: end,
                origin: row,
                type: GanttItemType.bar,
            };
            if (ganttView.colorField && row[ganttView.colorField]) {
                item.color = row[ganttView.colorField];
            }
            if (ganttView.progressField) {
                item.progress = row[ganttView.progressField] ? Number(row[ganttView.progressField] / 100.0) : 0;
            }
            if (ganttView.groupField) {
                item.group_id = row[ganttView.groupField];
            }
            if (row) {
                Object.keys(row).forEach(key => {
                    if (this.eruptBuildModel.eruptModel.eruptFieldModelMap
                        .get(key)?.eruptFieldJson.edit.type == EditType.DATE) {
                        row[key] = new Date(row[key]).toLocaleString();
                    }
                })
            }
            itemMap.set(id, item);
            allItems.push(item);
        });
        let pidField = ganttView.pidField;
        if (pidField) {
            pidField = pidField.replace(/\./g, '_');
            const rootItems: GanttItem[] = [];
            allItems.forEach(item => {
                const row = this.data.find(r => String(r[primaryKeyCol]) === item.id);
                if (row && row[pidField]) {
                    const parentId = String(row[pidField]);
                    const parent = itemMap.get(parentId);
                    if (parent) {
                        if (!parent.children) {
                            parent.children = [];
                            parent.expandable = true;
                            parent.expanded = true;
                        }
                        parent.children.push(item);
                    } else {
                        rootItems.push(item);
                    }
                } else {
                    rootItems.push(item);
                }
            });
            this.items = rootItems;
            // calculate the maximum tree depth and update the column width
            const maxDepth = this.calculateMaxDepth(rootItems);
            this.editColumnWidth = (90 + maxDepth * 20);
        } else {
            this.items = allItems;
            this.editColumnWidth = 90;
        }
    }

    /**
     * Calculate the maximum tree depth
     * @param items array of Gantt chart items
     * @param currentDepth current depth (starting from 1)
     * @returns maximum depth
     */
    private calculateMaxDepth(items: GanttItem[], currentDepth: number = 1): number {
        if (!items || items.length === 0) {
            return currentDepth - 1;
        }
        let maxDepth = currentDepth;
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                const childDepth = this.calculateMaxDepth(item.children, currentDepth + 1);
                maxDepth = Math.max(maxDepth, childDepth);
            }
        });
        return maxDepth;
    }

    private parseDate(dateValue: any): number {
        if (!dateValue) {
            return null;
        }
        const momentDate = moment(dateValue);
        if (!momentDate.isValid()) {
            return null;
        }
        return momentDate.valueOf();
    }

    protected readonly FieldVisibility = FieldVisibility;
    protected readonly SelectMode = SelectMode;
}
