import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {Fields, Meta, PivotSheet, S2Options, TableSheet} from "@antv/s2";

@Component({
    selector: 'erupt-chart-table',
    templateUrl: './chart-table.component.html',
    styleUrls: ['./chart-table.component.less'],
    styles: [],
})
export class ChartTableComponent implements OnInit, AfterViewInit {

    constructor() {
    }

    s2: TableSheet;

    @ViewChild('s2t') chartTable: ElementRef;

    ngOnInit() {
    }

    ngAfterViewInit(): void {
        this.s2 = new TableSheet(this.chartTable.nativeElement, {
            data: [],
            fields: {},
        }, null);
        this.s2.render();
    }

    render(data: any[]) {
        let metas: Meta[] = [];
        let columns: string[] = [];
        if (data && data.length > 0) {
            for (let key in data[0]) {
                metas.push({field: key, name: key});
                columns.push(key);
            }
        }
        this.s2.setDataCfg({
            data: data,
            fields: {
                columns: columns
            },
            meta: metas,
            showDefaultHeaderActionIcon: true
        })
        this.onResize();
        this.s2.render(true);
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        if (this.s2) {
            let ele = this.chartTable.nativeElement;
            this.s2.changeSheetSize(ele.offsetWidth, ele.offsetHeight)
            this.s2.render(false) // 不重新加载数据
        }
    }


}
