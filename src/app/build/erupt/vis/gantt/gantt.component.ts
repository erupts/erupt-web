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
import {SelectMode} from "../../model/erupt.enum";

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

    @Input() selectionMode: SelectMode | null = null; // 选择模式，null 表示使用默认多选

    @Output() onEdit = new EventEmitter<any>();

    @Output() onUpdate = new EventEmitter<any>();

    @Output() onSelectionChange = new EventEmitter<any[]>();

    @ViewChild('gantt', {static: false}) ganttComponent: NgxGanttComponent;

    clientHeight: number = document.body.clientHeight;

    columnMap: Map<any, STColumn>;

    items: GanttItem[] = [];

    groups: GanttGroup[] = [];

    editColumnWidth: number = 0; // 编辑列宽度，根据树层级动态计算

    selectedItemIds: Set<string> = new Set<string>(); // 存储选中的项目ID

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
        let start = moment(Number(e.item.start) * 1000).format('YYYY-MM-DD 00:00:00');
        let end = moment(Number(e.item.end) * 1000).format('YYYY-MM-DD 23:59:59');
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
     * 切换项目的选中状态
     * @param item 甘特图项目
     */
    toggleSelection(item: GanttItem, event?: Event): void {
        const itemId = item.id;

        // 如果是单选模式
        if (this.selectionMode === SelectMode.radio) {
            if (this.selectedItemIds.has(itemId)) {
                this.selectedItemIds.delete(itemId);
            } else {
                // 清除所有选中项，只选中当前项
                this.selectedItemIds.clear();
                this.selectedItemIds.add(itemId);
            }
        } else {
            // 多选模式
            if (this.selectedItemIds.has(itemId)) {
                this.selectedItemIds.delete(itemId);
                // 取消选中时，同时取消选中所有子节点
                this.unselectChildren(item);
            } else {
                this.selectedItemIds.add(itemId);
            }
        }
        this.emitSelectionChange();
    }

    /**
     * 处理单选框点击事件
     * @param item 甘特图项目
     * @param event 点击事件
     */
    onRadioClick(item: GanttItem, event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.toggleSelection(item);
    }

    /**
     * 取消选中所有子节点
     * @param item 父节点
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
     * 检查项目是否被选中
     * @param item 甘特图项目
     * @returns 是否选中
     */
    isSelected(item: GanttItem): boolean {
        return this.selectedItemIds.has(item.id);
    }

    /**
     * 检查所有项目（包括子节点）是否都被选中
     * @returns 是否全部选中
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
     * 检查是否有部分项目被选中（用于显示半选状态）
     * @returns 是否有部分选中
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
     * 全选/取消全选
     * @param checked 是否选中
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
     * 收集所有选中的行数据并发送给上级组件
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
            // 数据变化时清空选中状态
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
            // 计算树的最大深度并更新列宽度
            const maxDepth = this.calculateMaxDepth(rootItems);
            this.editColumnWidth = (90 + maxDepth * 20);
        } else {
            this.items = allItems;
            this.editColumnWidth = 90;
        }
    }

    /**
     * 计算树的最大深度
     * @param items 甘特图项目数组
     * @param currentDepth 当前深度（从1开始）
     * @returns 最大深度
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
