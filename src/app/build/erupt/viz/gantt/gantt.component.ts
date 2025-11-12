import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {GanttItem, GanttViewType} from "@worktile/gantt";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Viz} from "../../model/erupt.model";
import * as moment from 'moment';

@Component({
    selector: 'viz-gantt',
    templateUrl: './gantt.component.html',
    styleUrls: ['./gantt.component.less']
})
export class GanttComponent implements OnChanges {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() viz: Viz;

    @Output() onEdit = new EventEmitter<any>();

    items: GanttItem[] = [
        { id: '000000', title: 'Task 0', start: 1627729997000, end: 1628421197000, expandable: true },
        { id: '000001', title: 'Task 1', start: 1617361997000, end: 1625483597000, expandable: true },
        { id: '000002', title: 'Task 2', start: 1610536397000, end: 1610622797000 },
        { id: '000003', title: 'Task 3', start: 1628507597000, end: 1633345997000, expandable: true }
    ];

    protected readonly GanttViewType = GanttViewType;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] || changes['viz'] || changes['eruptBuildModel']) {
            // this.convertDataToGanttItems();
        }
    }

    private convertDataToGanttItems(): void {
        if (!this.data || !this.data.length || !this.viz || !this.viz.ganttView || !this.eruptBuildModel) {
            this.items = [];
            return;
        }

        const ganttView = this.viz.ganttView;
        const startDateField = ganttView.startDateField;
        const endDateField = ganttView.endDateField;
        const pidField = ganttView.pidField;
        const primaryKeyCol = this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;

        // 获取标题字段（使用第一个字段作为标题，或者使用 primaryKeyCol）
        const titleField = this.viz.fields && this.viz.fields.length > 0
            ? this.viz.fields[0]
            : primaryKeyCol;

        // 先创建所有项目
        const itemMap = new Map<string, GanttItem>();
        const allItems: GanttItem[] = [];

        this.data.forEach((row, index) => {
            const id = String(row[primaryKeyCol] || index);
            const start = this.parseDate(row[startDateField]);
            const end = this.parseDate(row[endDateField]);

            // 只处理有效的日期数据
            if (!start || !end) {
                return;
            }

            const item: GanttItem = {
                id: id,
                title: String(row[titleField] || `任务 ${index + 1}`),
                start: start,
                end: end
            };

            itemMap.set(id, item);
            allItems.push(item);
        });

        // 如果有父级字段，构建层级结构
        if (pidField) {
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
