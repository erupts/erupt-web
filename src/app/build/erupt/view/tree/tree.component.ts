import {Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {ActivatedRoute} from "@angular/router";
import {NzFormatEmitEvent, NzMessageService, NzModalService, NzTreeBaseService} from "ng-zorro-antd";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Subscription} from "rxjs";
import {Status} from "../../model/erupt-api.model";
import {colRules} from "@shared/model/util.model";
import {SettingsService} from "@delon/theme";

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
            this.fetchTreeData();
            this.dataService.getEruptBuild(this.eruptName).subscribe(eb => {
                this.dataHandler.initErupt(eb);
                this.eruptBuildModel = eb;
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
                this.nodes = this.dataHandler.dataTreeToZorroTree(tree);
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
                this.msg.success("添加成功");
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
                    this.msg.success("修改成功");
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
                    this.msg.warning(pidEdit.title + "：不可以选择自己作为父级");
                    return false;
                } else {
                    if (this.tree.getSelectedNodeList().length > 0) {
                        let children = this.tree.getSelectedNodeList()[0].getChildren();
                        if (children.length > 0) {
                            for (let child of children) {
                                if (pid == child.origin.key) {
                                    this.msg.warning(pidEdit.title + "：不可以选择自己的子级作为父级");
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
                nzTitle: "请确认是否要删除",
                nzContent: "",
                nzOnOk: () => {
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName, nzTreeNode.origin.key)
                        .subscribe(function (res) {
                            if (res.status == Status.SUCCESS) {
                                that.fetchTreeData();
                                that.msg.success("删除成功");
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
