import {Component, Input, OnInit} from '@angular/core';
import {Dashboard, FilterControl, FilterDSL} from "../../model/dashboard.model";
import {CubeMeta, FieldType} from "../../model/cube.model";
import {CubeOperator} from "../../model/cube-query.model";
import {CubeApiService} from "../../service/cube-api.service";

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

    data: Record<string, any>[] = null;

    isLoading = false;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit(): void {
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
                if (this.cubeMeta.parameters.filter(it => it.code == this.filter.field).length == 0) {
                    this.cubeApiService.query({
                        cube: this.cubeMeta.code,
                        explore: this.dashboard.explore,
                        dimensions: [this.filter.field],
                        measures: [],
                        limit: 300,
                    }).subscribe(res => {
                        this.data = res.data;
                        this.isLoading = false;
                    })
                } else {
                    //TODO fetch parameters list
                }
            }
        }
    }

    protected readonly CubeOperator = CubeOperator;
    protected readonly FilterControl = FilterControl;
    protected readonly FieldType = FieldType;
}
