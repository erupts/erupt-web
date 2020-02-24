import {Component, Input, OnInit} from "@angular/core";
import {NzFormatEmitEvent} from "ng-zorro-antd";
import {Dimension} from "../model/bi.model";
import {BiDataService} from "../service/data.service";

@Component({
    selector: "app-tree-select",
    templateUrl: "./reference.component.html",
    styles: []
})
export class ReferenceComponent implements OnInit {

    @Input() dimension: Dimension;

    @Input() code: string;

    searchValue: string;

    data: any[];

    constructor(private dataService: BiDataService) {

    }

    ngOnInit() {
        this.dataService.getBiReference(this.code, this.dimension.code, null).subscribe((res) => {
            res.forEach(r => {
                r.isLeaf = true;
            });
            this.data = res;
        })
    }

    nodeClickEvent(event: NzFormatEmitEvent) {
        this.dimension.$viewValue = event.node.origin.title;
        this.dimension.$value = event.node.origin.key;
    }

}
