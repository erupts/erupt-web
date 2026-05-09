import {Component, Input, OnInit} from '@angular/core';
import {Dashboard, DashboardDSL, FilterDSL} from "../../model/dashboard.model";
import {CubeMeta, FieldType} from "../../model/cube.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeApiService} from "../../service/cube-api.service";
import {VL} from "../../../erupt/model/erupt-field.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from '@core';

@Component({
    selector: 'cube-puzzle-filter-control',
    standalone: false,
    templateUrl: './cube-puzzle-filter-control.html',
    styleUrl: './cube-puzzle-filter-control.less'
})
export class CubePuzzleFilterControl implements OnInit {

    @Input() filter: FilterDSL;

    @Input() cubeMeta: CubeMeta;

    @Input() dashboard: Dashboard;

    @Input() dsl: DashboardDSL;

    @Input() size: "large" | "small" | "default" = "default";

    @Input() configMode = false;

    readonly NULL_SENTINEL = '__null__';

    data: VL[] = null;

    isLoading = false;

    constructor(private cubeApiService: CubeApiService, private message: NzMessageService, private i18n: I18NService) {
    }

    ngOnInit(): void {
        if (this.configMode) {
            if (!this.filter.defaultValue && this.filter.operator == CubeOperator.BETWEEN) {
                this.filter.defaultValue = [null, null];
            }
        } else {
            if (this.filter.defaultValue !== null && this.filter.defaultValue !== undefined
                && (this.filter.value === null || this.filter.value === undefined)) {
                this.filter.value = this.filter.defaultValue;
            }
            if (!this.filter.value && this.filter.operator == CubeOperator.BETWEEN) {
                this.filter.value = [null, null];
            }
            // Pre-populate data with current value for echo-back display without API call
            const val = this.filter.value;
            if (val !== null && val !== undefined) {
                if (Array.isArray(val) && val.length > 0) {
                    this.data = val.map(v => this.toVL(v));
                } else if (!Array.isArray(val)) {
                    this.data = [this.toVL(val)];
                }
            }
        }
    }

    get currentValue(): any {
        const raw = this.configMode ? this.filter.defaultValue : this.filter.value;
        if (raw === null && (this.filter.operator === CubeOperator.EQ || this.filter.operator === CubeOperator.NEQ)) {
            return this.NULL_SENTINEL;
        }
        return raw;
    }

    set currentValue(v: any) {
        const store = (raw: any) => raw === this.NULL_SENTINEL ? null : raw;
        const stored = Array.isArray(v) ? v.map(store) : store(v);
        if (this.configMode) {
            this.filter.defaultValue = stored;
        } else {
            this.filter.value = stored;
        }
    }

    private toVL(raw: any): VL {
        const isNull = raw === null || raw === undefined || raw === '';
        return {label: isNull ? this.NULL_SENTINEL : raw, value: isNull ? null : raw};
    }

    updateValueAt(index: number, val: any) {
        const arr = (this.currentValue ? [...this.currentValue] : [null, null]);
        arr[index] = val;
        this.currentValue = arr;
        this.onValueChange(val);
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

    clean() {
        this.data = null;
    }

    isMeasure() {
        return this.cubeMeta.measures.find(it => it.code === this.filter.field);
    }

    openSelect(open: boolean) {
        if (open) {
            this.data = null;
            this.isLoading = true;
            if (this.filter.field) {
                const queryFilters = [];
                if (this.filter.linkage) {
                    for (let linkageField of this.filter.linkage) {
                        const linkageFilter = this.dsl.filters.find(it => it.field === linkageField);
                        if (linkageFilter) {
                            if (linkageFilter.value === null || linkageFilter.value === undefined || (Array.isArray(linkageFilter.value) && linkageFilter.value.length === 0)) {
                                this.message.warning(this.i18n.fanyi('cube.filter.control.select_linkage_first') + (linkageFilter.title || this.cubeMeta.fieldTitleMap.get(linkageFilter.field)));
                                this.isLoading = false;
                                return;
                            }
                            queryFilters.push({
                                field: linkageFilter.field,
                                operator: linkageFilter.operator || CubeOperator.EQ,
                                value: linkageFilter.value
                            });
                        }
                    }
                }
                if (this.cubeMeta.parameters.filter(it => it.code == this.filter.field).length > 0) {
                    this.cubeApiService.parameterItems(this.cubeMeta.code, this.filter.field).subscribe({
                        next: res => {
                            this.data = res.data;
                        },
                        complete: () => this.isLoading = false
                    })
                } else {
                    this.cubeApiService.query({
                        cube: this.cubeMeta.code,
                        explore: this.dashboard.explore,
                        dimensions: [this.filter.field],
                        filters: queryFilters,
                        limit: 500,
                    }).subscribe({
                        next: res => {
                            this.data = res.data.map(datum => this.toVL(datum[this.filter.field]));
                        },
                        complete: () => this.isLoading = false
                    })
                }
            }
        }
    }

    onValueChange(e) {
        if (this.dsl.filters) {
            this.dsl.filters.forEach(f => {
                if (f.linkage && f.linkage.includes(this.filter.field)) {
                    if (f.operator == CubeOperator.BETWEEN) {
                        f.value = [null, null];
                    } else {
                        f.value = null;
                    }
                }
            })
        }
    }

    protected readonly CubeOperator = CubeOperator;
    protected readonly FieldType = FieldType;
}
