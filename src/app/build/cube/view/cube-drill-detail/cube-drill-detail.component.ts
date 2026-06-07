import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CubeApiService} from "../../service/cube-api.service";
import {STColumn, STComponent} from "@delon/abc/st";
import {CubeMeta, FieldType} from "../../model/cube.model";
import {Dashboard} from "../../model/dashboard.model";
import {CubeFilter} from "../../model/cube-query.model";
import {finalize} from "rxjs/operators";

@Component({
    selector: 'cube-drill-detail',
    standalone: false,
    templateUrl: './cube-drill-detail.component.html',
    styleUrls: ['./cube-drill-detail.component.less']
})
export class CubeDrillDetailComponent implements OnInit {

    @Input() measure: string;        // drill-down measure
    @Input() dashboard: Dashboard;   // dashboard configuration
    @Input() cubeMeta: CubeMeta;    // cube metadata
    @Input() filters?: CubeFilter[]; // filters
    @Input() cube?: string;          // overrides dashboard.cuber (used with sub-models)
    @Input() explore?: string;       // overrides dashboard.explore (used with sub-models)

    @ViewChild('st', {static: false}) st: STComponent;

    loading: boolean = false;

    drillData: any[] = [];

    stColumns: STColumn[] = [];

    virtualScroll: boolean = false;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit(): void {
        this.loadDrillData();
    }

    /**
     * Load drill-down data
     */
    loadDrillData(): void {
        this.loading = true;

        // get all dimension fields
        const dimensions = this.cubeMeta?.dimensions?.map(d => d.code) || [];
        this.cubeApiService.query({
            cube: this.cube || this.dashboard.cuber,
            explore: this.explore || this.dashboard.explore,
            dimensions: dimensions,
            measures: [],
            groupBy: false,
            filters: this.filters || [],
            parameter: {},
            limit: 1000
        }).pipe(
            finalize(() => { this.loading = false; })
        ).subscribe({
            next: (response) => {
                this.drillData = response.data;
                this.buildDrillColumns();
                this.virtualScroll = this.drillData.length > 200;
            },
            error: () => {}
        });
    }

    /**
     * Build drill-down table columns
     */
    buildDrillColumns(): void {
        this.stColumns = [];

        // add dimension columns
        this.cubeMeta.dimensions.forEach(dim => {
            this.stColumns.push({
                title: dim.title,
                index: [dim.code],
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
                },
                format: (item: any) => {
                    const val = item[dim.code];
                    if (dim.type === FieldType.DATE) {
                        return new Date(val).toLocaleString();
                    }
                    return val;
                }
            });
        });
    }

    /**
     * Export data
     */
    export(): void {
        let csv = [];
        let header = this.stColumns.map(col => col.title);
        csv.push(header.map(it => '"' + it.replace(/"/g, '""') + '"').join(','));

        for (let row of this.drillData) {
            let values = [];
            for (let col of this.stColumns) {
                let val = row[col.index as string];
                let field = this.cubeMeta.fieldMap.get(<string>col.index);
                if (val === null || val === undefined) {
                    val = '';
                } else if (field.type === FieldType.DATE) {
                    val = val.toLocaleString();
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
        anchor.download = `drill_${this.cubeMeta.fieldTitleMap.get(this.measure)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

}
