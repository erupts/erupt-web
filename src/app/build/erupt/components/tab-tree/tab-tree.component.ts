import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {NzTreeNode} from "ng-zorro-antd/core/tree/nz-tree-base-node";
import {DataHandlerService} from "../../service/data-handler.service";
import {DataService} from "@shared/service/data.service";
import {calcChecks} from "@shared/util/zorro.util";
import {NzFormatEmitEvent} from "ng-zorro-antd/core/tree";

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
        if (event.node.isChecked) {
            this.eruptFieldModel.eruptFieldJson.edit.$value = Array.from(
                new Set([...this.eruptFieldModel.eruptFieldJson.edit.$value, ...calcChecks([event.node])])
            );
        } else {
            let value = this.eruptFieldModel.eruptFieldJson.edit.$value;
            let checks = calcChecks([event.node]);
            let result = [];
            if (checks && checks.length > 0) {
                let checkMaps = {};
                for (let r of checks) {
                    checkMaps[r] = r;
                }
                for (let i = 0; i < value.length; i++) {
                    if (!checkMaps[value[i]]) {
                        result.push(value[i]);
                    }
                }
            }
            this.eruptFieldModel.eruptFieldJson.edit.$value = result;
        }
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
