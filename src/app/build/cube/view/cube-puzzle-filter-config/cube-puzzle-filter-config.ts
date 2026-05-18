import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Dashboard, DashboardDSL, FilterDSL, parseRelativeDefault} from "../../model/dashboard.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeMeta, FieldType} from "../../model/cube.model";
import {CubeApiService} from "../../service/cube-api.service";
import {CubePuzzleFilterControl} from "../cube-puzzle-filter-control/cube-puzzle-filter-control";

@Component({
    selector: 'cube-puzzle-filter-config',
    templateUrl: './cube-puzzle-filter-config.html',
    standalone: false,
    styleUrl: './cube-puzzle-filter-config.less'
})
export class CubePuzzleFilterConfig implements OnInit {

    @Input() filter: FilterDSL;

    @Input() cubeMeta: CubeMeta;

    @Input() dashboard: Dashboard;

    @Input() dsl: DashboardDSL;

    @ViewChild("filterControl") filterControl: CubePuzzleFilterControl;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit(): void {

    }

    clean() {
        this.filterControl?.clean();
    }

    isRelativeDefault(): boolean {
        return parseRelativeDefault(this.filter.defaultValue) !== null;
    }

    get relativeType(): 'PAST' | 'FUTURE' {
        return parseRelativeDefault(this.filter.defaultValue)?.type ?? 'PAST';
    }

    set relativeType(type: 'PAST' | 'FUTURE') {
        this.filter.defaultValue = `${type}:${this.relativeDays}`;
    }

    get relativeDays(): number {
        return parseRelativeDefault(this.filter.defaultValue)?.days ?? 7;
    }

    set relativeDays(days: number) {
        this.filter.defaultValue = `${this.relativeType}:${days}`;
    }

    onDefaultTypeChange(type: 'absolute' | 'relative') {
        if (type === 'relative') {
            this.filter.defaultValue = 'PAST:7';
        } else {
            this.filter.defaultValue = [null, null];
        }
    }

    fieldType(): FieldType {
        for (let dimension of this.cubeMeta.dimensions) {
            if (dimension.code === this.filter.field) {
                return dimension.type;
            }
        }
        for (let measure of this.cubeMeta.measures) {
            if (measure.code === this.filter.field) {
                return measure.type;
            }
        }
        for (let parameter of this.cubeMeta.parameters) {
            if (parameter.code === this.filter.field) {
                return parameter.type;
            }
        }
        return FieldType.STRING;
    }

    fieldInParameters() {
        if (this.filter.field) {
            return this.cubeMeta.parameters.find(param => param.code === this.filter.field);
        }
        return false;
    }

    changeField(e) {
        this.filter.linkage = null;
        if (this.fieldInParameters()) {
            this.filter.operator = null;
        } else {
            switch (this.fieldType()) {
                case FieldType.STRING:
                    this.filter.operator = CubeOperator.EQ;
                    break;
                case FieldType.NUMBER:
                    this.filter.operator = CubeOperator.EQ;
                    break;
                case FieldType.DATE:
                    this.filter.operator = CubeOperator.BETWEEN;
                    break;
            }
        }
        this.filter.value = null;
        this.filter.defaultValue = null;
        this.filterControl?.clean();
    }

    changeOperator(e) {
        if (this.filter.operator === CubeOperator.BETWEEN) {
            this.filter.value = [null, null];
            this.filter.defaultValue = [null, null];
        } else {
            this.filter.value = null;
            this.filter.defaultValue = null;
        }
    }

    getLinkageFilters() {
        if (!this.dsl.filters) {
            return [];
        }
        const map = new Map<string, FilterDSL>();
        this.dsl.filters.forEach(f => {
            const isParameter = this.cubeMeta.parameters.find(param => param.code === f.field);
            if (!map.has(f.field) && f.field !== this.filter.field && !isParameter) {
                map.set(f.field, f);
            }
        });
        return Array.from(map.values());
    }

    isDropdownOperator(): boolean {
        if (this.filter.field) {
            if ([CubeOperator.EQ, CubeOperator.NEQ, CubeOperator.IN, CubeOperator.NOT_IN].includes(this.filter.operator)) {
                return null != this.cubeMeta.dimensions.find(it => it.code === this.filter.field && it.type == FieldType.STRING);
            }
        }
        return false;
    }

    protected readonly CubeOperator = CubeOperator;
    protected readonly FieldType = FieldType;
}
