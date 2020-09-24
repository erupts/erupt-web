import {Component, Input, OnInit} from "@angular/core";
import {NzFormatEmitEvent} from "ng-zorro-antd";
import {BiDataService} from "../../service/data.service";
import {Dimension, DimType} from "../../model/bi.model";
@Component({
    selector: "erupt-reference-select",
    templateUrl: "./reference.component.html",
    styles: []
})
export class ReferenceComponent implements OnInit {

    @Input() dimension: Dimension;

    @Input() code: string;

    searchValue: string;

    multiple: boolean;

    data: any[];

    loading: boolean = false;

    constructor(private dataService: BiDataService) {

    }

    ngOnInit() {
        this.multiple = (this.dimension.type === DimType.REFERENCE_MULTI);
        this.loading = true;
        this.dataService.getBiReference(this.code, this.dimension.code, null).subscribe((res) => {
            res.forEach(r => {
                r.isLeaf = true;
            });
            this.data = res;
            this.loading = false;
        });
    }

    nodeClickEvent(event: NzFormatEmitEvent) {
        this.dimension.$viewValue = event.node.origin.title;
        this.dimension.$value = event.node.origin.key;
    }


    nodeCheck(event: NzFormatEmitEvent) {
        let viewValues = [];
        event.checkedKeys.forEach(e => {
            viewValues.push(e.origin.title);
        });
        this.dimension.$value = event.keys;
        this.dimension.$viewValue = viewValues.join(",");
    }

}
