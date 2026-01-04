import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzFormatEmitEvent, NzTreeNodeOptions} from "ng-zorro-antd/core/tree";

@Component({
    standalone: false,
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

    @Output() trigger: EventEmitter<string[]> = new EventEmitter();

    searchValue: string;

    treeLoading: boolean;

    selectedKeys: any[];

    list: NzTreeNodeOptions[];

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
            if (this.eruptModel.eruptJson.linkTree.dependNode) {
                if (data.length > 0) {
                    this.trigger.emit(this.getSubKeys(this.list, data[0].id));
                    this.selectedKeys = [data[0].id];
                }
            } else {
                this.list.unshift({
                    key: undefined,
                    title: this.i18n.fanyi('global.all'),
                    isLeaf: true
                });
                this.selectedKeys = [undefined];
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
            this.selectedKeys = [undefined];
        } else {
            let dt = this.eruptModel.eruptJson.linkTree;
            if (!event.node.origin.selected && !dt.dependNode) {
                this.trigger.emit(null);
                this.selectedKeys = [undefined];
            } else {
                this.trigger.emit(this.getSubKeys(this.list, event.node.origin.key));
                this.selectedKeys = [event.node.origin.key];
            }
        }
    }

    /**
     *  Get all keys under the selected node (including itself)
     */
    getSubKeys(options: NzTreeNodeOptions[], key: string): string[] {
        const find = (nodes: NzTreeNodeOptions[]): NzTreeNodeOptions | null => {
            for (const n of nodes) {
                if (n.key === key) return n;                 // 命中
                const child = find(n.children ?? []);        // 去子树里找
                if (child) return child;
            }
            return null;
        };
        const target = find(options);
        if (!target) return [];
        /* 2. 从目标节点开始 DFS，只收它子树的 key */
        const keys: string[] = [];
        const dfs = (n: NzTreeNodeOptions) => {
            keys.push(n.key);
            (n.children ?? []).forEach(dfs);
        };
        dfs(target);
        return keys;
    }
}
