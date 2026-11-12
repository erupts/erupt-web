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
import {PageDescMode} from "@shared/component/page-desc/page-desc.component";
import {FormSize, Scene} from "../../model/erupt.enum";
import {FormModalService} from "../../service/form-modal.service";
import {LocalSettingsService} from "../../service/local-settings.service";
import {PrintTypeComponent} from "../../components/print-type/print-type";
import {cloneDeep} from "lodash";
import {canPrint} from "../../model/erupt.model";
import {FlowModelComponent} from "../../components/flow-model/flow-model.component";

@Component({
    standalone: false,
    selector: "erupt-tree",
    templateUrl: "./tree.component.html",
    styleUrls: ["./tree.component.less"]
})
export class TreeComponent implements OnInit, OnDestroy {

    readonly PageDescMode = PageDescMode;

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

    // Level of the selected node, roots being 1; decides whether "add child" is still offered
    currentLevel: number = 0;

    selectedKeys: any[] = [];

    printLoading: boolean = false;

    readonly canPrint = canPrint;

    // Default matches the skeleton's .sk-nav width so there is no jump on load
    treeWidth: number = 235;

    resizing: boolean = false;

    sortAsc: boolean | null = null;

    mobileTreeCollapsed: boolean = false;

    checkable: boolean = false;

    checkedKeys: string[] = [];

    checkedCount: number = 0;

    @ViewChild("treeDiv", {static: false})
    treeDiv: ElementRef;

    @ViewChild("tree", {static: false}) tree: NzTreeBaseService;

    @ViewChild("flow", {static: true}) flow: FlowModelComponent;

    // approvals concerning the selected node, the one in progress first
    nodeFlows: any[] = [];

    constructor(private dataService: DataService,
                public route: ActivatedRoute,
                @Inject(NzMessageService)
                private msg: NzMessageService,
                public settingSrv: SettingsService,
                private i18n: I18NService,

                @Inject(NzModalService)
                private modal: NzModalService,
                private formModal: FormModalService,
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
                this.dataHandler.initErupt(eb);
                this.eruptBuildModel = eb;
                this.nodeFlows = [];
                this.flow.load(eb);
                this.fetchTreeData();
                this.addBlock();
            });
        });
    }


    addBlock(callback?: Function) {
        this.showEdit = true;
        this.loading = true;
        this.selectLeaf = false;
        if (this.tree?.getSelectedNodeList()?.[0]) {
            this.tree.getSelectedNodeList()[0].isSelected = false;
        }
        this.behavior = Scene.ADD;
        this.nodeFlows = [];
        this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName).subscribe(data => {
            this.loading = false;
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            callback && callback();
        }, () => {
            this.loading = false;
        });
    }

    // A node at @Tree.maxLevel cannot take children; the server enforces the same limit on save
    canAddSub(): boolean {
        let tree = this.eruptBuildModel.eruptModel.eruptJson.tree;
        return !tree.maxLevel || this.currentLevel < tree.maxLevel;
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

    async add() {
        const flow = await this.flow.header("ADD");
        if (!flow) return;
        this.loading = true;
        this.behavior = Scene.ADD;
        this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
            this.dataHandler.eruptValueToObject(this.eruptBuildModel), flow).subscribe(result => {
            this.fetchTreeData();
            this.dataHandler.emptyEruptValue(this.eruptBuildModel);
            // taken over by an approval flow: its dialog already told the user
            if (!this.flow.submitted(result)) this.msg.success(this.i18n.fanyi("global.add.success"));
            this.loading = false;
        }, error => {
            this.loading = false;
        });
    }

    async update() {
        //validate menu and data integrity
        if (this.validateParentIdValue()) {
            const flow = await this.flow.header("EDIT");
            if (!flow) return;
            this.loading = true;
            this.dataService.updateEruptData(this.eruptBuildModel.eruptModel.eruptName,
                this.dataHandler.eruptValueToObject(this.eruptBuildModel), flow).subscribe(result => {
                if (this.flow.submitted(result)) {
                    // the node keeps its values until approved: show them again, with the approval now pending
                    this.reloadNode();
                } else if (result.status == Status.SUCCESS) {
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
            this.formModal.open({
                owner: this,
                title: this.i18n.fanyi("global.copy"),
                fullLine,
                okText: this.i18n.fanyi("global.add"),
                params: {eruptBuildModel: this.eruptBuildModel, behavior: Scene.ADD, prefillData: data},
                onOk: async ref => {
                    if (ref.getContentComponent().beforeSaveValidate()) {
                        const flow = await this.flow.header("ADD");
                        if (!flow) return false;
                        const res = await this.dataService.addEruptData(
                            eruptName,
                            this.dataHandler.eruptValueToObject(this.eruptBuildModel),
                            flow
                        ).toPromise();
                        if (!this.flow.submitted(res)) this.msg.success(this.i18n.fanyi("global.add.success"));
                        this.fetchTreeData();
                        return true;
                    }
                    return false;
                }
            });
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
                nzOnOk: async () => {
                    const flow = await this.flow.header("DELETE");
                    if (!flow) return;
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName, nzTreeNode.origin.key, flow)
                        .subscribe(res => {
                            // the node stays until its deletion is approved
                            if (this.flow.submitted(res)) {
                                this.reloadNode();
                                return;
                            }
                            this.behavior = Scene.ADD;
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

    toggleCheckable(): void {
        this.checkable = !this.checkable;
        this.checkedKeys = [];
        this.checkedCount = 0;
    }

    onCheckBoxChange(): void {
        this.checkedCount = this.collectCheckedKeys().length;
    }

    //checked parents cascade to children; collect keys deepest-first so children are deleted before parents
    private collectCheckedKeys(): string[] {
        const keys: string[] = [];
        const walk = (node: any) => {
            node.getChildren().forEach(walk);
            keys.push(node.origin.key);
        };
        this.tree.getCheckedNodeList().forEach(walk);
        return keys;
    }

    batchDel(): void {
        const keys = this.collectCheckedKeys();
        if (keys.length === 0) return;
        this.modal.confirm({
            nzTitle: this.i18n.fanyi("global.delete.hint"),
            nzContent: "",
            nzOkDanger: true,
            nzOnOk: async () => {
                const flow = await this.flow.header("DELETE");
                if (!flow) return;
                this.treeLoading = true;
                this.dataService.deleteEruptDataList(this.eruptBuildModel.eruptModel.eruptName, keys, flow).subscribe(res => {
                    this.treeLoading = false;
                    if (this.flow.submitted(res)) {
                        this.checkedKeys = [];
                        this.checkedCount = 0;
                        this.reloadNode();
                    } else if (res.status == Status.SUCCESS) {
                        this.msg.success(this.i18n.fanyi("global.delete.success"));
                        this.checkedKeys = [];
                        this.checkedCount = 0;
                        if (this.currentKey && keys.indexOf(this.currentKey) > -1) {
                            this.currentKey = null;
                            this.showEdit = false;
                        }
                        this.fetchTreeData();
                    }
                }, () => {
                    this.treeLoading = false;
                });
            }
        });
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

    // A decision on an approval may have changed the tree, the selected node and what is still pending
    onFlowChanged() {
        this.fetchTreeData();
        if (this.selectLeaf && this.currentKey) this.loadNode();
    }

    // the selected node as stored, and the approvals concerning it
    private reloadNode() {
        this.flow.refresh();
        this.loadFlowMarks();
        if (this.selectLeaf && this.currentKey) this.loadNode();
    }

    private loadNode() {
        this.loading = true;
        this.loadNodeFlows();
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        }, () => {
            this.loading = false;
            // gone since: an approved deletion
            this.currentKey = null;
            this.showEdit = false;
        });
    }

    // the model turned out to run through flows: its nodes and the selected one show their approvals
    onFlowReady() {
        this.loadFlowMarks();
        this.loadNodeFlows();
    }

    // which nodes approvals concern, so a node waiting on one shows it in the tree
    private loadFlowMarks() {
        const keys: any[] = [];
        const walk = (nodes: any[]) => nodes.forEach(n => {
            keys.push(n.key);
            if (n.children?.length) walk(n.children);
        });
        walk(this.nodes);
        this.flow.loadMarks(keys);
    }

    loadNodeFlows() {
        this.nodeFlows = [];
        if (!this.flow.active || !this.selectLeaf || !this.currentKey) return;
        const key = this.currentKey;
        this.flow.flowsOf(key).subscribe(flows => {
            if (key === this.currentKey) this.nodeFlows = flows;
        });
    }

    get nodeFlowPending(): boolean {
        return this.nodeFlows[0]?.status === "PENDING";
    }

    fetchTreeData() {
        this.sortAsc = null;
        this.flow.refresh();
        this.treeLoading = true;
        const scrollTop = this.getTreeScrollTop();
        this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
            this.treeLoading = false;
            if (tree) {
                this.dataLength = this.dataHandler.countNodes(tree);
                this.nodes = this.dataHandler.dataTreeToZorroTree(tree, this.eruptBuildModel.eruptModel.eruptJson.tree.expandLevel);
                this.loadFlowMarks();
                if (this.currentKey) {
                    this.selectedKeys = [this.currentKey];
                    setTimeout(() => this.locateNode(), 200);
                } else {
                    this.selectedKeys = [];
                    this.restoreTreeScroll(scrollTop);
                }
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

    //the scroll container is the virtual viewport when virtual scroll is active, otherwise the nav body div
    private getTreeScrollTop(): number {
        const el = this.treeDiv?.nativeElement;
        if (!el) return 0;
        const viewport = el.querySelector('.cdk-virtual-scroll-viewport');
        return viewport ? viewport.scrollTop : el.scrollTop;
    }

    private restoreTreeScroll(top: number): void {
        if (!top) return;
        setTimeout(() => {
            const el = this.treeDiv?.nativeElement;
            if (!el) return;
            const viewport = el.querySelector('.cdk-virtual-scroll-viewport');
            if (viewport) {
                viewport.scrollTop = top;
            } else {
                el.scrollTop = top;
            }
        }, 200);
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
        this.currentLevel = event.node.level + 1;
        this.selectedKeys = [this.currentKey];
        if (window.innerWidth <= 767) {
            this.mobileTreeCollapsed = true;
        }
        this.behavior = Scene.EDIT;
        this.showEdit = true;
        this.loadNodeFlows();
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        }, () => {
            this.loading = false;
        });
    }

}
