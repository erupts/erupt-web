import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {NzFormatEmitEvent} from "ng-zorro-antd";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {STComponent} from "@delon/abc";
import {TreeComponent} from "../tree/tree.component";
import {WindowModel} from "@shared/model/window.model";
import {SettingsService} from "@delon/theme";

@Component({
    selector: 'layout-tree',
    templateUrl: './layout-tree.component.html',
    styles: []
})
export class LayoutTreeComponent implements OnInit {

    constructor(private data: DataService,
                public settingService: SettingsService,
                private dataHandler: DataHandlerService) {
    }

    @Input() eruptModel: EruptModel;

    @Output() trigger = new EventEmitter();

    searchValue: string;

    treeLoading: boolean;

    list: any;

    ngOnInit() {
        this.treeLoading = true;
        this.data.queryDependTreeData(this.eruptModel.eruptName).subscribe(data => {
            this.list = this.dataHandler.dataTreeToZorroTree(data);
            if (!this.eruptModel.eruptJson.linkTree.dependNode) {
                this.list.unshift({
                    key: null,
                    title: "全部",
                    isLeaf: true
                });
            }
            this.treeLoading = false;
        });
    }

    nzDblClick(event: NzFormatEmitEvent) {
        event.node.isExpanded = !event.node.isExpanded;
        event.event.stopPropagation();
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        if (event.node.origin.key == null) {
            this.trigger.emit(null);
        } else {
            let dt = this.eruptModel.eruptJson.linkTree;
            if (!event.node.origin.selected && !dt.dependNode) {
                this.trigger.emit(null);
            } else {
                this.trigger.emit(event.node.origin.key);
            }
        }
        // this.data.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
        //     this.loading = false;
        //     this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
        // });
    }

}
