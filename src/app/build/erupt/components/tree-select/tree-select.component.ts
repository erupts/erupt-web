import {Component, Input, OnInit} from "@angular/core";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {NzFormatEmitEvent, NzTreeNodeOptions} from "ng-zorro-antd/core/tree";

@Component({
    selector: "app-tree-select",
    templateUrl: "./tree-select.component.html",
    styles: []
})
export class TreeSelectComponent implements OnInit {

    @Input() eruptField: EruptFieldModel;

    @Input() eruptModel: EruptModel;

    @Input() parentEruptName: string;

    @Input() dependVal: any;

    list: NzTreeNodeOptions[];

    searchValue: string;

    constructor(private data: DataService, private dataHandler: DataHandlerService) {

    }

    ngOnInit() {
        this.data.queryReferenceTreeData(this.eruptModel.eruptName, this.eruptField.fieldName, this.dependVal, this.parentEruptName)
            .subscribe(tree => {
                this.list = this.dataHandler.dataTreeToZorroTree(tree, this.eruptField.eruptFieldJson.edit.referenceTreeType.expandLevel);
            });
    }

    nodeClickEvent(event: NzFormatEmitEvent) {
        this.eruptField.eruptFieldJson.edit.$tempValue = {
            id: event.node.origin.key,
            label: event.node.origin.title
        };
    }

}
