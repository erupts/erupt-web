import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {MenuService, SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzFormatEmitEvent, NzTreeNodeOptions} from "ng-zorro-antd/core/tree";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {EditComponent} from "../edit/edit.component";
import {Scene} from "../../model/erupt.enum";
import {Status} from "../../model/erupt-api.model";
import {EruptBuildModel} from "../../model/erupt-build.model";

@Component({
    standalone: false,
    selector: 'layout-tree',
    templateUrl: './layout-tree.component.html',
    styleUrls: ['./layout-tree.component.less']
})
export class LayoutTreeComponent implements OnInit {

    constructor(private data: DataService,
                public settingSrv: SettingsService,
                private i18n: I18NService,
                private dataHandler: DataHandlerService,
                private menuSrv: MenuService,
                @Inject(NzMessageService) private msg: NzMessageService,
                @Inject(NzModalService) private modal: NzModalService) {
    }

    @Input() eruptModel: EruptModel;

    @Output() trigger: EventEmitter<string[]> = new EventEmitter();

    searchValue: string;

    treeLoading: boolean;

    selectedKeys: any[];

    selectedKey: string;

    list: NzTreeNodeOptions[];

    dataLength: number = 0;

    @ViewChild('treeBody') treeBody: ElementRef;

    private linkTreeField: string;

    private treeBuildModel: EruptBuildModel;

    sortAsc: boolean | null = null;

    get canAdd(): boolean { return !!this.linkTreeField && null != this.menuSrv.getItem(this.linkTreeField + '@ADD'); }
    get canEdit(): boolean { return !!this.linkTreeField && null != this.menuSrv.getItem(this.linkTreeField + '@EDIT'); }
    get canDelete(): boolean { return !!this.linkTreeField && null != this.menuSrv.getItem(this.linkTreeField + '@DELETE'); }
    ngOnInit() {
        const cfgField = this.eruptModel.eruptJson.linkTree?.field;
        if (cfgField) {
            const fm = this.eruptModel.eruptFieldModels?.find(f => f.fieldName === cfgField);
            this.linkTreeField = fm?.fieldReturnName;
        }
        this.loadTreeData();
        if (this.canAdd || this.canEdit || this.canDelete) {
            this.fetchTreeBuildModel();
        }
    }

    private fetchTreeBuildModel() {
        const cfgField = this.eruptModel.eruptJson.linkTree?.field;
        const fieldModel = this.eruptModel.eruptFieldModelMap?.get(cfgField);
        if (!fieldModel?.eruptFieldJson?.edit?.referenceTreeType) return;
        this.data.getEruptBuildByField(this.eruptModel.eruptName, cfgField).subscribe(eb => {
            this.treeBuildModel = eb;
        });
    }

    loadTreeData() {
        this.sortAsc = null;
        this.selectedKey = null;
        this.selectedKeys = [];
        this.treeLoading = true;
        this.data.queryDependTreeData(this.eruptModel.eruptName).subscribe(data => {
            let eruptFieldModel = this.eruptModel.eruptFieldModelMap.get(this.eruptModel.eruptJson.linkTree.field);
            this.dataLength = this.dataHandler.countNodes(data);
            if (eruptFieldModel && eruptFieldModel.eruptFieldJson.edit && eruptFieldModel.eruptFieldJson.edit.referenceTreeType) {
                this.list = this.dataHandler.dataTreeToZorroTree(data, eruptFieldModel.eruptFieldJson.edit.referenceTreeType.expandLevel);
            } else {
                this.list = this.dataHandler.dataTreeToZorroTree(data, this.eruptModel.eruptJson.tree.expandLevel);
            }
            if (this.eruptModel.eruptJson.linkTree.dependNode) {
                if (data.length > 0) {
                    this.trigger.emit(this.getSubKeys(this.list, data[0].id));
                    this.selectedKeys = [data[0].id];
                    this.selectedKey = data[0].id;
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
        }, () => {
            this.treeLoading = false;
        });
    }

    addNode() {
        const eb = this.treeBuildModel;
        this.dataHandler.initErupt(eb);
        const modal = this.modal.create({
            nzTitle: this.i18n.fanyi('global.new'),
            nzContent: EditComponent,
            nzOkText: this.i18n.fanyi('global.add'),
            nzMaskClosable: false,
            nzKeyboard: false,
            nzStyle: {top: '60px'},
            nzWrapClassName: 'modal-lg edit-modal-lg',
            nzOnOk: async () => {
                if (modal.getContentComponent().beforeSaveValidate()) {
                    await this.data.addEruptData(eb.eruptModel.eruptName,
                        this.dataHandler.eruptValueToObject(eb)).toPromise();
                    this.msg.success(this.i18n.fanyi('global.add.success'));
                    this.loadTreeData();
                    return true;
                }
                return false;
            }
        });
        modal.getContentComponent().eruptBuildModel = eb;
        modal.getContentComponent().behavior = Scene.ADD;
    }

    editNode() {
        if (!this.selectedKey) return;
        const eb = this.treeBuildModel;
        this.dataHandler.initErupt(eb);
        const modal = this.modal.create({
            nzTitle: this.i18n.fanyi('global.editor'),
            nzContent: EditComponent,
            nzOkText: this.i18n.fanyi('global.update'),
            nzMaskClosable: false,
            nzKeyboard: false,
            nzStyle: {top: '60px'},
            nzWrapClassName: 'modal-lg edit-modal-lg',
            nzOnOk: async () => {
                if (modal.getContentComponent().beforeSaveValidate()) {
                    const res = await this.data.updateEruptData(eb.eruptModel.eruptName,
                        this.dataHandler.eruptValueToObject(eb)).toPromise();
                    if (res.status === Status.SUCCESS) {
                        this.msg.success(this.i18n.fanyi('global.update.success'));
                        this.loadTreeData();
                        return true;
                    }
                    return false;
                }
                return false;
            }
        });
        modal.getContentComponent().eruptBuildModel = eb;
        modal.getContentComponent().behavior = Scene.EDIT;
        modal.getContentComponent().id = this.selectedKey;
    }

    deleteNode() {
        if (!this.selectedKey) return;
        const eruptName = this.treeBuildModel.eruptModel.eruptName;
        this.modal.confirm({
            nzTitle: this.i18n.fanyi('global.delete.hint'),
            nzOnOk: () => {
                this.data.deleteEruptData(eruptName, this.selectedKey).subscribe(res => {
                    if (res.status === Status.SUCCESS) {
                        this.msg.success(this.i18n.fanyi('global.delete.success'));
                        this.selectedKey = null;
                        this.selectedKeys = [undefined];
                        this.loadTreeData();
                    }
                });
            }
        });
    }

    get hasHierarchy(): boolean {
        return this.list?.some(n => !n.isLeaf) ?? false;
    }

    expandAll(): void {
        this.setExpanded(this.list, true);
        this.list = [...this.list];
    }

    collapseAll(): void {
        this.setExpanded(this.list, false);
        this.list = [...this.list];
    }

    private setExpanded(nodes: NzTreeNodeOptions[], expanded: boolean): void {
        for (const n of nodes) {
            if (!n.isLeaf) n.expanded = expanded;
            if (n.children?.length) this.setExpanded(n.children, expanded);
        }
    }

    toggleSort(): void {
        if (this.sortAsc === null) this.sortAsc = true;
        else if (this.sortAsc === true) this.sortAsc = false;
        else { this.loadTreeData(); return; }
        const hasAll = this.list?.[0]?.key === undefined;
        const items = hasAll ? this.list.slice(1) : this.list;
        const sorted = this.sortNodes([...items], this.sortAsc);
        this.list = hasAll ? [this.list[0], ...sorted] : sorted;
    }

    locateNode(): void {
        this.expandPathTo(this.list, this.selectedKey);
        this.list = [...this.list];
        this.selectedKeys = [...this.selectedKeys];
        setTimeout(() => {
            const container = this.treeBody?.nativeElement;
            if (!container) return;
            const selected = container.querySelector('.ant-tree-node-selected');
            if (selected) {
                selected.scrollIntoView({behavior: 'smooth', block: 'center'});
                return;
            }
            const viewport = container.querySelector('.cdk-virtual-scroll-viewport');
            if (!viewport) return;
            const idx = this.flattenVisible(this.list).findIndex(n => n.key === this.selectedKey);
            if (idx >= 0) viewport.scrollTop = Math.max(0, idx * 28 - viewport.clientHeight / 2);
        }, 100);
    }

    private expandPathTo(nodes: NzTreeNodeOptions[], key: string): boolean {
        for (const n of nodes) {
            if (n.key === key) return true;
            if (n.children?.length && this.expandPathTo(n.children, key)) {
                n.expanded = true;
                return true;
            }
        }
        return false;
    }

    private flattenVisible(nodes: NzTreeNodeOptions[]): NzTreeNodeOptions[] {
        const result: NzTreeNodeOptions[] = [];
        for (const n of nodes) {
            result.push(n);
            if (n.expanded && n.children?.length) result.push(...this.flattenVisible(n.children));
        }
        return result;
    }

    private sortNodes(nodes: NzTreeNodeOptions[], asc: boolean): NzTreeNodeOptions[] {
        nodes.sort((a, b) => asc
            ? String(a.title).localeCompare(String(b.title))
            : String(b.title).localeCompare(String(a.title)));
        nodes.forEach(n => { if (n.children?.length) n.children = this.sortNodes([...n.children], asc); });
        return nodes;
    }

    nzDblClick(event: NzFormatEmitEvent) {
        event.node.isExpanded = !event.node.isExpanded;
        event.event.stopPropagation();
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        if (event.node.origin.key == null) {
            this.trigger.emit(null);
            this.selectedKeys = [undefined];
            this.selectedKey = null;
        } else {
            let dt = this.eruptModel.eruptJson.linkTree;
            if (!event.node.origin.selected && !dt.dependNode) {
                this.trigger.emit(null);
                this.selectedKeys = [undefined];
                this.selectedKey = null;
            } else {
                this.trigger.emit(this.getSubKeys(this.list, event.node.origin.key));
                this.selectedKeys = [event.node.origin.key];
                this.selectedKey = event.node.origin.key;
            }
        }
    }

    /**
     *  Get all keys under the selected node (including itself)
     */
    getSubKeys(options: NzTreeNodeOptions[], key: string): string[] {
        const find = (nodes: NzTreeNodeOptions[]): NzTreeNodeOptions | null => {
            for (const n of nodes) {
                if (n.key === key) return n;                 // found
                const child = find(n.children ?? []);        // search in subtree
                if (child) return child;
            }
            return null;
        };
        const target = find(options);
        if (!target) return [];
        /* 2. start DFS from the target node, collecting only the keys in its subtree */
        const keys: string[] = [];
        const dfs = (n: NzTreeNodeOptions) => {
            keys.push(n.key);
            (n.children ?? []).forEach(dfs);
        };
        dfs(target);
        return keys;
    }
}
