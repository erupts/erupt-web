import {Component, ElementRef, EventEmitter, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';

import {DatePipe} from '@angular/common';
import {NzTableComponent} from "ng-zorro-antd/table";


export interface TreeNodeInterface {
    id: number,
    name: string,
    scheduledStartTime: string,
    scheduledEndTime: string,
    actualStartTime: string,
    actualEndTime: string,
    schedule: number;
    expand: boolean;
    level: number;
    children?: TreeNodeInterface[];
}

@Component({
    selector: 'gantt-view',
    templateUrl: './gantt.component.html',
    styleUrls: ["./gantt.component.less"]
})
export class GanttComponent implements OnInit, OnChanges {

    public data: any = {
        infos: [{
            id: 1,
            name: '项目1',
            scheduledStartTime: '2018-08-15 9:00',
            scheduledEndTime: '2018-11-01 18:00',
            judge: [1,2,3],
            schedule: 0.5,
            expand: true,
            children: [{
                id: 11,
                name: '项目11',
                scheduledStartTime: '2018-12-01 9:00',
                scheduledEndTime: '2018-12-05 18:00',
                schedule: 0.5,
                judge: [1,2,3],
                expand: true,
                children: [{
                    id: 111,
                    name: '项目111',
                    scheduledStartTime: '2018-12-01 9:00',
                    scheduledEndTime: '2018-12-05 18:00',
                    schedule: 0.5,
                    judge: [2, 3],
                    expand: true,
                }]
            }, {
                id: 12,
                name: '项目12',
                scheduledStartTime: '2018-12-06 9:00',
                scheduledEndTime: '2018-12-10 18:00',
                schedule: 0.5,
                judge: [1],
                expand: true,
            }, {
                id: 13,
                name: '项目13',
                scheduledStartTime: '2018-12-06 9:00',
                scheduledEndTime: '2018-12-10 18:00',
                schedule: 0.5,
                judge: [1],
                expand: true,
            }]
        }, {
            id: 2,
            name: '项目2',
            scheduledStartTime: '2018-12-11 9:00',
            scheduledEndTime: '2018-12-18 18:00',
            schedule: 0.5
        }, {
            id: 3,
            name: '项目3',
            scheduledStartTime: '2018-12-20 9:00',
            scheduledEndTime: '2018-12-23 18:00',
            schedule: 0.5
        }, {
            id: 4,
            name: '项目4',
            scheduledStartTime: '2018-12-05 9:00',
            scheduledEndTime: '2018-12-10 18:00',
            schedule: 0.5
        }, {
            id: 5,
            name: '项目5',
            scheduledStartTime: '2018-12-08 9:00',
            scheduledEndTime: '2019-03-10 18:00',
            schedule: 0.5
        }],
        min: '2018-06-25 9:00',
        max: '2019-05-25 18:00'
    };
    @Output() addTree = new EventEmitter();
    @Output() editTree = new EventEmitter();
    @Output() deleteTree = new EventEmitter();
    @Output() collapses = new EventEmitter();

    @ViewChild('ganttList') table: NzTableComponent<any>;
    selectedValue = 'month';
    yearMonth: any[] = [];
    day: any[] = [];
    year: any[] = [];
    month: any[] = [];
    col: any;
    expandDataCache = {};

    private datePipe = new DatePipe('en-US');

    constructor(public elementRef: ElementRef) {
    }

    ngOnInit() {
        this.ngOnChanges(null);
    }

    ngOnChanges(changes: SimpleChanges): void {

        this.day = this.getDiffDates(this.data && this.data.min, this.data && this.data.max, 'day');

        this.yearMonth = this.getDiffDates(this.data && this.data.min, this.data && this.data.max, 'yearMonth');

        this.month = this.getDiffDates(this.data && this.data.min, this.data && this.data.max, 'month');

        this.year = this.getDiffDates(this.data && this.data.min, this.data && this.data.max, 'year');

        this.data && this.data.infos.map(item => {
            this.expandDataCache[item.id] = this.convertTreeToList(item);
        });

        this.arCol();

        this.table.nzLoading = false;

        const tableWidth = this.col.tag * this.col.width;

        this.table.nzScroll = {

            x: tableWidth + 300 + 'px',

            y: document.querySelector('body').clientHeight - 110 + 'px'

        };
    }

    collapse(array: TreeNodeInterface[], data: TreeNodeInterface, $event: boolean): void {

        this.collapses.emit(data);

        if ($event === false) {

            if (data.children) {

                data.children.forEach(d => {

                    const target = array.find(a => a.id === d.id);

                    target.expand = false;

                    this.collapse(array, target, false);

                });

            } else {
                return;
            }
        }
    }

    convertTreeToList(root: object): TreeNodeInterface[] {

        const stack = [], array = [], hashMap = {};

        stack.push({...root, level: 0});

        while (stack.length !== 0) {

            const node = stack.pop();

            this.visitNode(node, hashMap, array);

            if (node.children) {

                for (let i = node.children.length - 1; i >= 0; i--) {

                    stack.push({...node.children[i], level: node.level + 1, parent: node});

                }

            }

        }
        return array;
    }

    visitNode(node: TreeNodeInterface, hashMap: object, array: TreeNodeInterface[]): void {

        if (!hashMap[node.id]) {

            hashMap[node.id] = true;

            array.push(node);

        }

    }


    getDiffDates(start, end, type) {
        const startTime = new Date(Date.parse(start && start.replace(/-/g, '/'))),
            endTime = new Date(Date.parse(end && end.replace(/-/g, '/'))), dateArr = [];

        let years = null;

        while ((endTime.getTime() - startTime.getTime()) > 0) {

            const year = startTime.getFullYear();

            const month = (startTime.getMonth() + 1) < 10 ? '0' + '' + (startTime.getMonth() + 1) : (startTime.getMonth() + 1);

            const day = startTime.getDate().toString().length === 1 ? '0' + startTime.getDate() : startTime.getDate();

            if (type === 'yearMonth') {

                if (month !== years || month === null) {
                    years = month;
                    dateArr.push({
                        m: year + '.' + month, day: this.day.filter((s) => {
                            return s.m === year + '.' + month;
                        }).length
                    });
                }

            }

            if (type === 'day') {
                dateArr.push({day: day, m: year + '.' + month});
            }

            if (type === 'year') {
                if (year !== years) {
                    years = year;
                    dateArr.push({
                        year: year, month: this.month.filter((s) => {
                            return s.year === year;
                        }).length
                    });
                }
            }

            if (type === 'month') {
                if (month !== years || month === null) {
                    years = month;
                    dateArr.push({
                        m: month, day: this.day.filter((s) => {
                            return s.m === month;
                        }).length, year: year, width: this.getCountDays(year + '-' + month + '-' + day)
                    });
                }

            }
            startTime.setDate(startTime.getDate() + 1);
        }
        return dateArr;
    }

    getCountDays(data) {
        const curDate = new Date(Date.parse(data.replace(/-/g, '/')));

        const curMonth = curDate.getMonth();

        curDate.setMonth(curMonth + 1);

        curDate.setDate(0);

        return curDate.getDate() * 2 + 'px';
    }

    gattWidth(start, end): string {
        if (start !== undefined) {

            const startTime = new Date(Date.parse(start.replace(/-/g, '/'))).getTime();

            const endTime = new Date(Date.parse(end.replace(/-/g, '/'))).getTime();

            switch (this.selectedValue) {
                case 'year':
                    return Math.abs((endTime - startTime)) / (1000 * 60 * 60 * 24) + 'px';

                case 'day':
                    return Math.abs((endTime - startTime)) / (1000 * 60 * 60 * 24) * (this.col.width + 2) + 'px';

                case 'month':
                    return Math.abs((startTime - endTime)) / (1000 * 60 * 60 * 24) * 2.25 + 'px';
            }
        }
        return null;
    }

    gattLeft(start, end): string {
        if (start !== undefined) {
            const startTime = new Date(Date.parse(start.replace(/-/g, '/'))).getTime();
            const endTime = new Date(Date.parse(end.replace(/-/g, '/'))).getTime();

            switch (this.selectedValue) {
                case 'year':
                    const s = new Date(start).getFullYear() + '-01-01';

                    const yearTime = new Date(Date.parse(s.replace(/-/g, '/'))).getTime();

                    return Math.abs((yearTime - endTime)) / (1000 * 60 * 60 * 24) + 'px';

                case 'day':
                    return Math.abs((endTime - startTime)) / (1000 * 60 * 60 * 24) * (this.col.width + 2) + 'px';

                case 'month':
                    return Math.abs((startTime - endTime)) / (1000 * 60 * 60 * 24) * 2.3 + 'px';

            }
        }
        return null;
    }

    getDate(data): string {
        return this.datePipe.transform(new Date(Date.parse(data.replace(/-/g, '/'))), 'MM-dd');
    }

    addTrees(data) {
        this.addTree.emit(data);
    }

    editTrees(data) {
        this.editTree.emit(data);
    }

    deleteTrees(data) {
        this.deleteTree.emit(data);
    }

    dateSwitch(data) {
        this.selectedValue = data;

        this.arCol();

        const tableWidth = this.col.tag * (this.col.width + 2);

        this.table.nzScroll = {

            x: tableWidth + 300 + 'px',

            y: document.querySelector('body').clientHeight - 110 + 'px'
        };

    }

    arCol() {
        switch (this.selectedValue) {
            case 'year':
                this.col = {num: 48, tag: this.year.length, width: 365};
                break;
            case 'day':
                this.col = {num: 50, tag: this.day.length, width: 50};
                break;
            case 'month':
                this.col = {num: 12, tag: this.month.length, width: 60};
                break;
        }
    }
}
