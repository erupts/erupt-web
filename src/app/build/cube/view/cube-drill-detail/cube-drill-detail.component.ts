import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CubeApiService} from "../../service/cube-api.service";
import {STColumn, STComponent} from "@delon/abc/st";
import {CubeMeta} from "../../model/cube.model";
import {Dashboard} from "../../model/dashboard.model";

export interface DrillDetailParams {
    field: string;           // 下钻字段
    value: any;             // 下钻值
    dimension: string;      // 维度名称
    measure: string;        // 指标名称
    dashboard: Dashboard;   // 仪表板配置
    cubeMeta: CubeMeta;    // Cube 元数据
}

@Component({
    selector: 'cube-drill-detail',
    standalone: false,
    templateUrl: './cube-drill-detail.component.html',
    styleUrls: ['./cube-drill-detail.component.less']
})
export class CubeDrillDetailComponent implements OnInit {

    @Input() params: DrillDetailParams;

    @ViewChild('st', {static: false}) st: STComponent;

    loading: boolean = false;

    drillData: any[] = [];

    stColumns: STColumn[] = [];

    virtualScroll: boolean = false;

    scrollConfig: any = {x: '100%', y: '500px'};

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit(): void {
        this.loadDrillData();
    }

    /**
     * 加载下钻数据
     */
    loadDrillData(): void {
        this.loading = true;

        // 获取所有维度字段
        const dimensions = this.cubeMeta.dimensions.map(d => d.code);

        // 获取当前指标
        const measures = [this.params.measure];

        this.cubeApiService.query({
            cube: this.params.dashboard.cuber,
            explore: this.params.dashboard.explore,
            dimensions: dimensions,
            measures: measures,
            // filters: [
            //     {
            //         field: this.params.field,
            //         operator: CubeOperator.EQ,
            //         value: this.params.value
            //     }
            // ],
            parameters: {}
        }).subscribe({
            next: (response) => {
                this.drillData = response.data;
                this.buildDrillColumns();
                this.virtualScroll = this.drillData.length > 200;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    /**
     * 构建下钻表格列
     */
    buildDrillColumns(): void {
        this.stColumns = [];

        // 添加维度列
        this.params.cubeMeta.dimensions.forEach(dim => {
            this.stColumns.push({
                title: dim.title,
                index: dim.code,
                width: 150,
                sort: {
                    compare: (a: any, b: any) => {
                        const valA = a[dim.code];
                        const valB = b[dim.code];
                        if (valA === null || valA === undefined) return -1;
                        if (valB === null || valB === undefined) return 1;
                        if (typeof valA === 'number' && typeof valB === 'number') {
                            return valA - valB;
                        }
                        return String(valA).localeCompare(String(valB));
                    }
                },
                filter: {
                    type: 'keyword',
                    fn: (filter: any, record: any) => {
                        if (filter.value) {
                            const val = record[dim.code];
                            if (val !== null && val !== undefined) {
                                return String(val).indexOf(filter.value) !== -1;
                            }
                            return false;
                        }
                        return true;
                    }
                }
            });
        });

        // 添加指标列（高亮显示）
        this.stColumns.push({
            title: this.params.measure,
            index: this.params.measure,
            width: 150,
            className: 'measure-column',
            sort: {
                compare: (a: any, b: any) => {
                    const valA = a[this.params.measure];
                    const valB = b[this.params.measure];
                    if (valA === null || valA === undefined) return -1;
                    if (valB === null || valB === undefined) return 1;
                    return valA - valB;
                }
            },
            format: (item: any) => {
                const val = item[this.params.measure];
                if (typeof val === 'number') {
                    return val.toLocaleString();
                }
                return val;
            }
        });
    }

    /**
     * 导出数据
     */
    export(): void {
        let csv = [];
        let header = this.stColumns.map(col => col.title);
        csv.push(header.map(it => '"' + it.replace(/"/g, '""') + '"').join(','));

        for (let row of this.drillData) {
            let values = [];
            for (let col of this.stColumns) {
                let val = row[col.index as string];
                if (val === null || val === undefined) {
                    val = '';
                } else if (typeof val === 'string') {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                values.push(val);
            }
            csv.push(values.join(','));
        }

        let csvContent = csv.join('\n');
        let blob = new Blob(['\ufeff' + csvContent], {type: 'text/csv;charset=utf-8;'});
        let url = URL.createObjectURL(blob);
        let anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `drill_${this.params.dimension}_${this.params.value}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    get cubeMeta(): CubeMeta {
        return this.params.cubeMeta;
    }
}
