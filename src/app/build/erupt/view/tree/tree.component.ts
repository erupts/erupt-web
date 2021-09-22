import {Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {ActivatedRoute} from "@angular/router";
import {NzFormatEmitEvent, NzMessageService, NzModalService, NzTreeBaseService} from "ng-zorro-antd";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Subscription} from "rxjs";
import {Status} from "../../model/erupt-api.model";
import {colRules} from "@shared/model/util.model";
import {ALAIN_I18N_TOKEN, SettingsService} from "@delon/theme";
import {I18NService} from "@core";

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

    searchValue;

    nodes: any = [];

    selectLeaf: boolean = false;

    private router$: Subscription;

    private currentKey: string;

    @ViewChild("tree", {static: false}) tree: NzTreeBaseService;

    constructor(private dataService: DataService,
                public route: ActivatedRoute,
                @Inject(NzMessageService)
                private msg: NzMessageService,
                public settingSrv: SettingsService,
                @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
                @Inject(NzModalService)
                private modal: NzModalService,
                private dataHandler: DataHandlerService) {
    }

    ngOnInit(): void {
        this.router$ = this.route.params.subscribe((params) => {
            this.eruptBuildModel = null;
            this.eruptName = params.name;
            this.currentKey = null;
            this.showEdit = false;
            this.dataService.getEruptBuild(this.eruptName).subscribe(eb => {
                this.dataHandler.initErupt(eb);
                this.eruptBuildModel = eb;
                this.fetchTreeData();
            });
        });
    }

    // ngAfterViewInit(): void {
    //     setTimeout(() => this.showEdit = false, 500);
    // }


    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    fetchTreeData() {
        this.treeLoading = true;
        this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
            this.treeLoading = false;
            if (tree) {
                this.nodes = this.dataHandler.dataTreeToZorroTree(tree, this.eruptBuildModel.eruptModel.eruptJson.tree.expandLevel);
            }
        });
    }


    addBlock(callback?: Function) {
        this.showEdit = true;
        this.loading = true;
        this.selectLeaf = false;
        if (this.tree.getSelectedNodeList()[0]) {
            this.tree.getSelectedNodeList()[0].isSelected = false;
        }
        this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName).subscribe(data => {
            this.loading = false;
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            callback && callback();
        });
    }

    addSub() {
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
            this.dataService.editEruptData(this.eruptBuildModel.eruptModel.eruptName,
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
        const that = this;
        const nzTreeNode = this.tree.getSelectedNodeList()[0];
        if (nzTreeNode.isLeaf) {
            this.modal.confirm({
                nzTitle: this.i18n.fanyi("global.delete.hint"),
                nzContent: "",
                nzOnOk: () => {
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName, nzTreeNode.origin.key)
                        .subscribe(function (res) {
                            if (res.status == Status.SUCCESS) {
                                that.fetchTreeData();
                                that.msg.success(that.i18n.fanyi("global.delete.success"));
                            }
                            that.showEdit = false;
                        });
                }
            });
        } else {
            this.msg.error("存在叶节点不允许直接删除");
        }

    }

    nzDblClick(event: NzFormatEmitEvent) {
        event.node.isExpanded = !event.node.isExpanded;
        event.event.stopPropagation();
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        this.selectLeaf = true;
        this.loading = true;
        this.showEdit = true;
        this.currentKey = event.node.origin.key;
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.currentKey).subscribe(data => {
            this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
            this.loading = false;
        });
    }

}
