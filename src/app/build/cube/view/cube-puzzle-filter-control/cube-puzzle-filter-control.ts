import {Component, Input, OnInit} from '@angular/core';
import {Dashboard, FilterDSL} from "../../model/dashboard.model";
import {CubeMeta, FieldType} from "../../model/cube.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeApiService} from "../../service/cube-api.service";
import {VL} from "../../../erupt/model/erupt-field.model";

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

    @Input() size: "large" | "small" | "default" = "default";

    data: VL[] = null;

    isLoading = false;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit(): void {
        if (!this.filter.value && this.filter.operator == CubeOperator.BETWEEN) {
            this.filter.value = [null, null];
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

    clean() {
        this.data = null;
    }

    openSelect() {
        if (!this.data) {
            this.isLoading = true;
            if (this.filter.field) {
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
                        limit: 300,
                    }).subscribe({
                        next: res => {
                            let d: VL[] = [];
                            for (let datum of res.data) {
                                d.push({label: datum[this.filter.field], value: datum[this.filter.field]})
                            }
                            this.data = d;
                        },
                        complete: () => this.isLoading = false
                    })
                }
            }
        }
    }

    protected readonly CubeOperator = CubeOperator;
    protected readonly FieldType = FieldType;
}
