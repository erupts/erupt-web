import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzFormatEmitEvent} from "ng-zorro-antd/core/tree";

@Component({
    selector: 'layout-tree',
    templateUrl: './layout-tree.component.html',
    styles: []
})
export class LayoutTreeComponent implements OnInit {

    constructor(private data: DataService,
                public settingSrv: SettingsService,
                public settingService: SettingsService,
                private i18n: I18NService,
                private dataHandler: DataHandlerService) {
    }

    @Input() eruptModel: EruptModel;

    @Output() trigger = new EventEmitter();

    searchValue: string;

    treeLoading: boolean;

    list: any;

    dataLength: number = 0;

    ngOnInit() {
        this.treeLoading = true;
        this.data.queryDependTreeData(this.eruptModel.eruptName).subscribe(data => {
            let eruptFieldModel = this.eruptModel.eruptFieldModelMap.get(this.eruptModel.eruptJson.linkTree.field);
            this.dataLength = data.length;
            if (eruptFieldModel && eruptFieldModel.eruptFieldJson.edit && eruptFieldModel.eruptFieldJson.edit.referenceTreeType) {
                this.list = this.dataHandler.dataTreeToZorroTree(data, eruptFieldModel.eruptFieldJson.edit.referenceTreeType.expandLevel);
            } else {
                this.list = this.dataHandler.dataTreeToZorroTree(data, this.eruptModel.eruptJson.tree.expandLevel);
            }
            if (!this.eruptModel.eruptJson.linkTree.dependNode) {
                this.list.unshift({
                    key: undefined,
                    title: this.i18n.fanyi('global.all'),
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
