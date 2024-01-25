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
import {Scene} from "../../model/erupt.enum";

@Component({
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

    selectLeaf: boolean = false;

    private router$: Subscription;

    private currentKey: string;

    treeScrollTop: number = 0;

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
                private dataHandler: DataHandlerService) {
    }

    ngOnInit(): void {
        this.router$ = this.route.params.subscribe((params: any) => {
            this.eruptBuildModel = null;
            this.eruptName = params.name;
            this.currentKey = null;
            this.showEdit = false;
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
                edit.$value = id;
                edit.$viewValue = label;
            }
        });
    }

    add() {
        this.loading = true;
        this.behavior = Scene.ADD;
        this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
            this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
            this.loading = false;
            if (result.status == Status.SUCCESS) {
                this.fetchTreeData();
                this.dataHandler.emptyEruptValue(this.eruptBuildModel);
                this.msg.success(this.i18n.fanyi("global.add.success"));
            }
        });
    }

    save() {
        //校验菜单和合法性
        if (this.validateParentIdValue()) {
            this.loading = true;
            this.dataService.updateEruptData(this.eruptBuildModel.eruptModel.eruptName,
                this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
                if (result.status == Status.SUCCESS) {
                    this.msg.success(this.i18n.fanyi("global.update.success"));
                    this.fetchTreeData();
                }
                this.loading = false;
            });
        }
    }

    //校验上级菜单值得合法性
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
            this.msg.error("存在叶节点不允许直接删除");
        }
    }

    fetchTreeData() {
        this.treeLoading = true;
        this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
            this.treeLoading = false;
            if (tree) {
                this.nodes = this.dataHandler.dataTreeToZorroTree(tree, this.eruptBuildModel.eruptModel.eruptJson.tree.expandLevel);
                this.rollTreePoint();
            }
        });
    }

    private rollTreePoint() {
        let st = this.treeDiv.nativeElement.scrollTop;
        setTimeout(() => {
            this.treeScrollTop = st;
        }, 900);
    }

    nzDblClick(event: NzFormatEmitEvent) {
        event.node.isExpanded = !event.node.isExpanded;
        event.event.stopPropagation();
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        this.selectLeaf = true;
        this.loading = true;
        this.showEdit = true;
        this.currentKey = event.node.origin.key;
        this.behavior = Scene.EDIT;
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        });
    }

}
