import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CubeApiService} from "../../service/cube-api.service";
import {STColumn, STComponent} from "@delon/abc/st";
import {CubeMeta, CubeMetaDimension, FieldType} from "../../model/cube.model";
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

    // dimensions actually used for drill-down: drillFields-filtered or all
    private get effectiveDimensions(): CubeMetaDimension[] {
        const measureDef = this.cubeMeta?.measures?.find(m => m.code === this.measure);
        if (measureDef?.drillFields?.length) {
            return this.cubeMeta.dimensions.filter(d => measureDef.drillFields.includes(d.code));
        }
        return this.cubeMeta?.dimensions || [];
    }

    ngOnInit(): void {
        this.loadDrillData();
    }

    loadDrillData(): void {
        this.loading = true;
        const dimensions = this.effectiveDimensions.map(d => d.code);
        this.cubeApiService.query({
            cube: this.cube || this.dashboard.cuber,
            explore: this.explore || this.dashboard.explore,
            dimensions: dimensions,
            measures: [],
            groupBy: false,
            filters: this.filters || [],
            parameter: {},
            limit: 1000,
            drillMeasure: this.measure
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

    buildDrillColumns(): void {
        this.stColumns = this.effectiveDimensions.map(dim => ({
            title: dim.title,
            index: [dim.code],
            width: 150,
            sort: {
                compare: (a: any, b: any) => {
                    const valA = a[dim.code];
                    const valB = b[dim.code];
                    if (valA === null || valA === undefined) return -1;
                    if (valB === null || valB === undefined) return 1;
                    if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
                    return String(valA).localeCompare(String(valB));
                }
            },
            filter: {
                type: 'keyword',
                fn: (filter: any, record: any) => {
                    if (!filter.value) return true;
                    const val = record[dim.code];
                    return val !== null && val !== undefined && String(val).indexOf(filter.value) !== -1;
                }
            },
            format: (item: any) => {
                const val = item[dim.code];
                return dim.type === FieldType.DATE ? new Date(val).toLocaleString() : val;
            }
        }));
    }

    export(): void {
        const dims = this.effectiveDimensions;
        let csv = [dims.map(d => '"' + d.title.replace(/"/g, '""') + '"').join(',')];

        for (let row of this.drillData) {
            let values = dims.map(dim => {
                let val = row[dim.code];
                if (val === null || val === undefined) return '';
                if (dim.type === FieldType.DATE) return new Date(val).toLocaleString();
                return val;
            });
            csv.push(values.join(','));
        }

        let blob = new Blob(['﻿' + csv.join('\n')], {type: 'text/csv;charset=utf-8;'});
        let url = URL.createObjectURL(blob);
        let anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `drill_${this.cubeMeta.fieldTitleMap.get(this.measure)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

}
