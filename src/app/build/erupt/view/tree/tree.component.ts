import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {ActivatedRoute} from "@angular/router";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Subscription} from "rxjs";
import {Status} from "../../model/erupt-api.model";
import {colRules} from "@shared/model/util.model";
import {SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzFormatEmitEvent, NzTreeBaseService} from "ng-zorro-antd/core/tree";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {AppViewService} from "@shared/service/app-view.service";
import {FormSize, Scene} from "../../model/erupt.enum";
import {EditComponent} from "../edit/edit.component";
import {LocalSettingsService} from "../../service/local-settings.service";
import {PrintTypeComponent} from "../../components/print-type/print-type";
import {cloneDeep} from "lodash";

@Component({
    standalone: false,
    selector: "erupt-tree",
    templateUrl: "./tree.component.html",
    styleUrls: ["./tree.component.less"]
})
export class TreeComponent implements OnInit, OnDestroy {

    col = colRules[3];

    eruptName: string;

    eruptBuildModel: EruptBuildModel;

    showEdit: boolean = false;

    loading = false;

    treeLoading = false;

    behavior: Scene = Scene.ADD;

    searchValue: string;

    nodes: any = [];

    dataLength: number = 0;

    selectLeaf: boolean = false;

    private router$: Subscription;

    currentKey: string;

    selectedKeys: any[] = [];

    treeScrollTop: number = 0;

    printLoading: boolean = false;

    treeWidth: number = 235;

    resizing: boolean = false;

    sortAsc: boolean | null = null;

    mobileTreeCollapsed: boolean = false;

    @ViewChild("treeDiv", {static: false})
    treeDiv: ElementRef;

    @ViewChild("tree", {static: false}) tree: NzTreeBaseService;

    constructor(private dataService: DataService,
                public route: ActivatedRoute,
                @Inject(NzMessageService)
                private msg: NzMessageService,
                public settingSrv: SettingsService,
                private i18n: I18NService,
                private appViewService: AppViewService,
                @Inject(NzModalService)
                private modal: NzModalService,
                private dataHandler: DataHandlerService,
                private localSettings: LocalSettingsService) {
    }

    ngOnInit(): void {
        this.router$ = this.route.params.subscribe((params: any) => {
            this.eruptBuildModel = null;
            this.eruptName = params.name;
            this.currentKey = null;
            this.showEdit = false;
            const saved = this.localSettings.get(this.eruptName);
            if (saved?.treeWidth) this.treeWidth = saved.treeWidth;
            this.dataService.getEruptBuild(this.eruptName).subscribe(eb => {
                this.appViewService.setRouterViewDesc(eb.eruptModel.eruptJson.desc);
                this.dataHandler.initErupt(eb);
                this.eruptBuildModel = eb;
                this.fetchTreeData();
            });
        });
    }


    addBlock(callback?: Function) {
        this.showEdit = true;
        this.loading = true;
        this.selectLeaf = false;
        if (this.tree.getSelectedNodeList()[0]) {
            this.tree.getSelectedNodeList()[0].isSelected = false;
        }
        this.behavior = Scene.ADD;
        this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName).subscribe(data => {
            this.loading = false;
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            callback && callback();
        }, () => {
            this.loading = false;
        });
    }

    addSub() {
        this.behavior = Scene.ADD;
        let eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
        let id = eruptFieldModelMap.get(this.eruptBuildModel.eruptModel.eruptJson.tree.id).eruptFieldJson.edit.$value;
        let label = eruptFieldModelMap.get(this.eruptBuildModel.eruptModel.eruptJson.tree.label).eruptFieldJson.edit.$value;
        this.addBlock(() => {
            if (id) {
                let edit = eruptFieldModelMap.get(this.eruptBuildModel.eruptModel.eruptJson.tree.pid.split(".")[0]).eruptFieldJson.edit;
                edit.$value = {id, label};
            }
        });
    }

    add() {
        this.loading = true;
        this.behavior = Scene.ADD;
        this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
            this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
            this.fetchTreeData();
            this.dataHandler.emptyEruptValue(this.eruptBuildModel);
            this.msg.success(this.i18n.fanyi("global.add.success"));
            this.loading = false;
        }, error => {
            this.loading = false;
        });
    }

    update() {
        //validate menu and data integrity
        if (this.validateParentIdValue()) {
            this.loading = true;
            this.dataService.updateEruptData(this.eruptBuildModel.eruptModel.eruptName,
                this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
                if (result.status == Status.SUCCESS) {
                    this.msg.success(this.i18n.fanyi("global.update.success"));
                    this.fetchTreeData();
                }
                this.loading = false;
            }, () => {
                this.loading = false;
            });
        }
    }

    //validate the parent menu value's integrity
    validateParentIdValue(): boolean {
        let eruptJson = this.eruptBuildModel.eruptModel.eruptJson;
        let eruptFieldMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
        if (eruptJson.tree.pid) {
            let id = eruptFieldMap.get(eruptJson.tree.id).eruptFieldJson.edit.$value;
            let pidEdit = eruptFieldMap.get(eruptJson.tree.pid.split(".")[0]).eruptFieldJson.edit;
            let pid = pidEdit.$value;
            if (pid) {
                if (id == pid) {
                    this.msg.warning(pidEdit.title + ": " + this.i18n.fanyi("tree.validate.no_this_parent"));
                    return false;
                } else {
                    if (this.tree.getSelectedNodeList().length > 0) {
                        let children = this.tree.getSelectedNodeList()[0].getChildren();
                        if (children.length > 0) {
                            for (let child of children) {
                                if (pid == child.origin.key) {
                                    this.msg.warning(pidEdit.title + ": " + this.i18n.fanyi("tree.validate.no_this_children_parent"));
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    copyNode() {
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        const eruptJson = this.eruptBuildModel.eruptModel.eruptJson;
        this.loading = true;
        this.dataService.queryEruptDataById(eruptName, this.currentKey).subscribe(data => {
            this.loading = false;
            delete data[eruptJson.primaryKeyCol];
            let fullLine = false;
            const layout = eruptJson.layout;
            if (layout && layout.formSize == FormSize.FULL_LINE) fullLine = true;
            const modal = this.modal.create({
                nzDraggable: true,
                nzStyle: {top: "60px"},
                nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
                nzWidth: fullLine ? 550 : null,
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: this.i18n.fanyi("global.copy"),
                nzContent: EditComponent,
                nzOkText: this.i18n.fanyi("global.add"),
                nzOnOk: async () => {
                    if (modal.getContentComponent().beforeSaveValidate()) {
                        await this.dataService.addEruptData(
                            eruptName,
                            this.dataHandler.eruptValueToObject(this.eruptBuildModel)
                        ).toPromise().then(res => res);
                        this.msg.success(this.i18n.fanyi("global.add.success"));
                        this.fetchTreeData();
                        return true;
                    }
                    return false;
                }
            });
            const editComp = modal.getContentComponent();
            editComp.eruptBuildModel = this.eruptBuildModel;
            editComp.behavior = Scene.ADD;
            editComp.prefillData = data;
        }, () => {
            this.loading = false;
        });
    }

    del() {
        const nzTreeNode = this.tree.getSelectedNodeList()[0];
        if (nzTreeNode.isLeaf) {
            this.modal.confirm({
                nzTitle: this.i18n.fanyi("global.delete.hint"),
                nzContent: "",
                nzOnOk: () => {
                    this.behavior = Scene.ADD;
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName, nzTreeNode.origin.key)
                        .subscribe(res => {
                            if (res.status == Status.SUCCESS) {
                                nzTreeNode.remove();
                                if (nzTreeNode.parentNode) {
                                    if (nzTreeNode.parentNode.getChildren().length == 0) {
                                        this.fetchTreeData();
                                    }
                                } else {
                                    this.fetchTreeData();
                                }
                                this.addBlock();
                                this.msg.success(this.i18n.fanyi("global.delete.success"));
                            }
                            this.showEdit = false;
                        });
                }
            });
        } else {
            this.msg.error(this.i18n.fanyi("tree.delete_has_children"));
        }
    }

    toggleSort(): void {
        if (this.sortAsc === null) this.sortAsc = true;
        else if (this.sortAsc === true) this.sortAsc = false;
        else { this.fetchTreeData(); return; }
        this.nodes = this.sortNodes([...this.nodes], this.sortAsc);
    }

    locateNode(): void {
        this.expandPathTo(this.nodes, this.currentKey);
        this.nodes = [...this.nodes];
        this.selectedKeys = [...this.selectedKeys];
        setTimeout(() => {
            const container = this.treeDiv?.nativeElement;
            if (!container) return;
            const selected = container.querySelector('.ant-tree-node-selected');
            if (selected) {
                selected.scrollIntoView({behavior: 'smooth', block: 'center'});
                return;
            }
            const viewport = container.querySelector('.cdk-virtual-scroll-viewport');
            if (!viewport) return;
            const idx = this.flattenVisible(this.nodes).findIndex((n: any) => n.key === this.currentKey);
            if (idx >= 0) viewport.scrollTop = Math.max(0, idx * 28 - viewport.clientHeight / 2);
        }, 100);
    }

    private expandPathTo(nodes: any[], key: string): boolean {
        for (const n of nodes) {
            if (n.key === key) return true;
            if (n.children?.length && this.expandPathTo(n.children, key)) {
                n.expanded = true;
                return true;
            }
        }
        return false;
    }

    private flattenVisible(nodes: any[]): any[] {
        const result: any[] = [];
        for (const n of nodes) {
            result.push(n);
            if (n.expanded && n.children?.length) result.push(...this.flattenVisible(n.children));
        }
        return result;
    }

    private sortNodes(nodes: any[], asc: boolean): any[] {
        nodes.sort((a, b) => asc
            ? String(a.title).localeCompare(String(b.title))
            : String(b.title).localeCompare(String(a.title)));
        nodes.forEach(n => { if (n.children?.length) n.children = this.sortNodes([...n.children], asc); });
        return nodes;
    }

    printNode() {
        this.printLoading = true;
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
            this.printLoading = false;
            const printBuildModel = cloneDeep(this.eruptBuildModel);
            this.dataHandler.objectToEruptValue(data, printBuildModel);
            const modal = this.modal.create({
                nzTitle: this.i18n.fanyi('print.preview'),
                nzContent: PrintTypeComponent,
                nzWidth: 700,
                nzStyle: {top: '30px'},
                nzBodyStyle: {maxHeight: '75vh', overflow: 'auto'},
                nzMaskClosable: false,
                nzDraggable: true,
                nzOkText: this.i18n.fanyi('global.print'),
                nzOnOk: () => { modal.getContentComponent().print(); return false; }
            });
            modal.getContentComponent().eruptBuildModel = printBuildModel;
        }, () => { this.printLoading = false; });
    }

    fetchTreeData() {
        this.sortAsc = null;
        this.treeLoading = true;
        this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
            this.treeLoading = false;
            if (tree) {
                this.dataLength = this.dataHandler.countNodes(tree);
                this.nodes = this.dataHandler.dataTreeToZorroTree(tree, this.eruptBuildModel.eruptModel.eruptJson.tree.expandLevel);
                if (this.currentKey) {
                    this.selectedKeys = [this.currentKey];
                    setTimeout(() => this.locateNode(), 200);
                } else {
                    this.selectedKeys = [];
                }
                this.rollTreePoint();
                if (this.searchValue) {
                    let temp = this.searchValue;
                    this.searchValue = null;
                    setTimeout(() => {
                        this.searchValue = temp;
                    }, 0)
                }
            }
        }, () => {
            this.treeLoading = false;
        });
    }

    private rollTreePoint() {
        if (!this.treeDiv) return;
        let st = this.treeDiv.nativeElement.scrollTop;
        setTimeout(() => {
            this.treeScrollTop = st;
        }, 900);
    }

    nzDblClick(event: NzFormatEmitEvent) {
        event.node.isExpanded = !event.node.isExpanded;
        event.event.stopPropagation();
    }

    expandAll(): void {
        this.setExpanded(this.nodes, true);
        this.nodes = [...this.nodes];
    }

    collapseAll(): void {
        this.setExpanded(this.nodes, false);
        this.nodes = [...this.nodes];
    }

private setExpanded(nodes: any[], expanded: boolean): void {
        for (const n of nodes) {
            if (!n.isLeaf) n.expanded = expanded;
            if (n.children?.length) this.setExpanded(n.children, expanded);
        }
    }

    onResizeDragStart(e: MouseEvent): void {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = this.treeWidth;
        this.resizing = true;
        const onMove = (ev: MouseEvent) => {
            this.treeWidth = Math.max(150, Math.min(500, startWidth + ev.clientX - startX));
        };
        const onUp = () => {
            this.resizing = false;
            this.localSettings.patch(this.eruptName, {treeWidth: this.treeWidth});
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        this.selectLeaf = true;
        this.loading = true;
        this.currentKey = event.node.origin.key;
        this.selectedKeys = [this.currentKey];
        if (window.innerWidth <= 767) {
            this.mobileTreeCollapsed = true;
        }
        this.behavior = Scene.EDIT;
        this.showEdit = true;
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        }, () => {
            this.loading = false;
        });
    }

}
