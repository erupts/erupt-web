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

    @Input() onlyRead: boolean = false;

    treeData: any;

    loading = false;

    constructor(private dataService: DataService,
                private dataHandlerService: DataHandlerService) {
    }

    ngOnInit() {
        this.loading = true;
        this.dataService.findTabTree(this.eruptBuildModel.eruptModel.eruptName, this.eruptFieldModel.fieldName).subscribe(
            tree => {
                const tabTree = this.eruptBuildModel.tabErupts[this.eruptFieldModel.fieldName];
                this.treeData = this.dataHandlerService.dataTreeToZorroTree(tree,
                    tabTree ? tabTree.eruptModel.eruptJson.tree.expandLevel : 999) || [];
                this.loading = false;
            }
        );
    }

    checkBoxChange(event: NzFormatEmitEvent) {
        this.eruptFieldModel.eruptFieldJson.edit.$value = event.keys;
    }

    arrayAnyToString(array: any[]): string[] {
        if (array) {
            for (let i in array) {
                array[i] = array[i].toString();
            }
        }
        return array;
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
