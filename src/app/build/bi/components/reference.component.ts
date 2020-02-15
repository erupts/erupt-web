import {Component, Input, OnInit} from "@angular/core";
import {NzFormatEmitEvent} from "ng-zorro-antd";
import {DataService} from "@shared/service/data.service";
import {Dimension} from "../model/bi.model";

@Component({
    selector: "app-tree-select",
    templateUrl: "./reference.component.html",
    styles: []
})
export class ReferenceComponent implements OnInit {

    @Input() dimension:Dimension

    searchValue: string;

    constructor(private data: DataService) {

    }

    ngOnInit() {

    }

    nodeClickEvent(event: NzFormatEmitEvent) {
        // this.eruptField.eruptFieldJson.edit.$tempValue = {
        //     id: event.node.origin.key,
        //     label: event.node.origin.title
        // };
    }

}
