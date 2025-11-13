import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {GanttItem, GanttViewType, NgxGanttComponent} from "@worktile/gantt";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Viz} from "../../model/erupt.model";
import * as moment from 'moment';
import {EruptField} from "../../model/erupt-field.model";
import {STColumn} from "@delon/abc/st";
import {UiBuildService} from "../../service/ui-build.service";

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

    @ViewChild('gantt', {static: false}) ganttComponent: NgxGanttComponent;

    clientHeight: number = document.body.clientHeight;

    columnMap: Map<any, STColumn>;

    items: GanttItem[] = [];

    protected readonly GanttViewType = GanttViewType;

    constructor(private uiBuildService: UiBuildService,) {
    }

    ngOnInit(): void {
        this.columnMap = new Map<string, STColumn>()
        for (let col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(col.index, col);
        }
    }

    dragEnded(e) {
        console.log(e);
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
        let pidField = ganttView.pidField;

        // 先创建所有项目
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
                progress: 30,
            };
            itemMap.set(id, item);
            allItems.push(item);
        });

        // 如果有父级字段，构建层级结构
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
                        // 父级不存在，作为根节点
                        rootItems.push(item);
                    }
                } else {
                    // 没有父级，作为根节点
                    rootItems.push(item);
                }
            });
            console.log(rootItems)
            this.items = rootItems;
        } else {
            this.items = allItems;
        }
    }

    private parseDate(dateValue: any): number {
        if (!dateValue) {
            return null;
        }

        // 使用 moment 解析日期
        const momentDate = moment(dateValue);
        if (!momentDate.isValid()) {
            return null;
        }

        // 返回毫秒级时间戳
        return momentDate.valueOf();
    }

}
