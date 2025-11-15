import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {GanttDragEvent, GanttItem, GanttItemType, GanttViewType, NgxGanttComponent} from "@worktile/gantt";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Viz} from "../../model/erupt.model";
import * as moment from 'moment';
import {EruptField} from "../../model/erupt-field.model";
import {STColumn} from "@delon/abc/st";
import {UiBuildService} from "../../service/ui-build.service";
import {DataService} from "@shared/service/data.service";
import {NzMessageService} from "ng-zorro-antd/message";

@Component({
    selector: 'viz-gantt',
    templateUrl: './gantt.component.html',
    styleUrls: ['./gantt.component.less']
})
export class GanttComponent implements OnChanges, OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() viz: Viz;

    @Output() onEdit = new EventEmitter<any>();

    @Output() onUpdate = new EventEmitter<any>();

    @ViewChild('gantt', {static: false}) ganttComponent: NgxGanttComponent;

    clientHeight: number = document.body.clientHeight;

    columnMap: Map<any, STColumn>;

    items: GanttItem[] = [];

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
        let start = moment(e.item.start * 1000).format('YYYY-MM-DD 00:00:00');
        let end = moment(e.item.end * 1000).format('YYYY-MM-DD 23:59:59');
        this.dataService.updateGanttDate(this.eruptBuildModel.eruptModel.eruptName, this.viz.code, e.item.id, start, end).subscribe(res => {
            for (let datum of this.data) {
                if (datum[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol] == e.item.id) {
                    datum[this.viz.ganttView.startDateField] = start;
                    datum[this.viz.ganttView.endDateField] = end;
                }
            }
        });
    }

    edit(item: GanttItem) {
        this.onEdit.emit(item.id)
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.convertDataToGanttItems();
        }
    }

    scrollToToday(): void {
        if (this.ganttComponent) {
            // 使用 scrollToToday 方法直接定位到今天
            this.ganttComponent.scrollToToday();
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
        const ganttView = this.viz.ganttView;
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
        } else {
            this.items = allItems;
        }
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

}
