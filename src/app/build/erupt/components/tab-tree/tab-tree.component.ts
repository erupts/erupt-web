import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {NzFormatEmitEvent} from "ng-zorro-antd";
import {NzTreeNode} from "ng-zorro-antd/core/tree/nz-tree-base-node";
import {DataHandlerService} from "../../service/data-handler.service";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: 'erupt-tab-tree',
    templateUrl: './tab-tree.component.html',
    styles: []
})
export class TabTreeComponent implements OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptFieldModel: EruptFieldModel;

    treeData: any;

    loading = false;

    constructor(private dataService: DataService,
                private dataHandlerService: DataHandlerService) {
    }

    ngOnInit() {
        this.loading = true;
        this.dataService.findTabTree(this.eruptBuildModel.eruptModel.eruptName, this.eruptFieldModel.fieldName).subscribe(
            tree => {
                if (tree) {
                    this.treeData = this.dataHandlerService.dataTreeToZorroTree(tree);
                }
                this.loading = false;
            }
        );
    }

    checkBoxChange(event: NzFormatEmitEvent) {
        this.eruptFieldModel.eruptFieldJson.edit.$value = event.keys;
        // if (event.node.isChecked) {
        //     this.eruptFieldModel.eruptFieldJson.edit.$value.push(...this.findChecks([event.node]));
        // }
    }

    //递归获取所有选中的值
    findChecks(treeNodes: NzTreeNode[], result: any[] = []) {
        treeNodes.forEach(node => {
            result.push(node.origin.key);
            if (node.children) {
                this.findChecks(node.children, result);
            }
        });
        return result;
    }

}
