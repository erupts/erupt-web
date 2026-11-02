import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {NzFormatEmitEvent, NzTreeNodeOptions} from "ng-zorro-antd/core/tree";
import {NzTreeComponent} from "ng-zorro-antd/tree";

@Component({
    standalone: false,
    selector: "app-tree-select",
    templateUrl: "./tree-select.component.html",
    styles: []
})
export class TreeSelectComponent implements OnInit {

    @Input() eruptField: EruptFieldModel;

    @Input() eruptModel: EruptModel;

    @Input() parentEruptName: string;

    @Input() dependVal: any;

    // checkable multi-select mode: $tempValue holds an array of {id, label}
    @Input() multiple: boolean = false;

    @ViewChild('tree') tree: NzTreeComponent;

    list: NzTreeNodeOptions[];

    dataLength: number = 0;

    searchValue: string;

    constructor(private data: DataService, private dataHandler: DataHandlerService) {

    }

    ngOnInit() {
        this.data.queryReferenceTreeData(this.eruptModel.eruptName, this.eruptField.fieldName, this.dependVal, this.parentEruptName)
            .subscribe(tree => {
                this.dataLength = this.dataHandler.countNodes(tree);
                const refType = this.eruptField.eruptFieldJson.edit.referenceTreeType;
                this.list = this.dataHandler.dataTreeToZorroTree(tree, refType.expandLevel, refType.leafOnly);
            });
    }

    nodeClickEvent(event: NzFormatEmitEvent) {
        // leaf-only mode marks parents as non-selectable, so a click on one is a no-op
        if (event.node && !event.node.isSelectable) return;
        if (this.multiple) {
            event.node.setChecked(!event.node.isChecked);
            this.checkBoxChange();
            return;
        }
        this.eruptField.eruptFieldJson.edit.$tempValue = {
            id: event.node.origin.key,
            label: event.node.origin.title
        };
    }

    checkBoxChange() {
        this.eruptField.eruptFieldJson.edit.$tempValue = this.tree.getCheckedNodeList().map(node => ({
            id: node.origin.key,
            label: node.origin.title
        }));
    }

}
