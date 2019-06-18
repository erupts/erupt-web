import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { ActivatedRoute } from "@angular/router";
import { NzFormatEmitEvent, NzMessageService, NzModalService, NzTreeBaseService } from "ng-zorro-antd";
import { colRules } from "../../../erupt/model/util.model";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";
import { EruptAndEruptFieldModel, EruptBuildModel } from "../../../erupt/model/erupt-build.model";
import { Subscription } from "rxjs";

@Component({
  selector: "erupt-tree",
  templateUrl: "./tree.component.html",
  styleUrls: ["./tree.component.less"]
})
export class TreeComponent implements OnInit, OnDestroy {

  private colRules = colRules;

  private eruptName: string;

  public eruptBuildModel: EruptBuildModel;

  private showEdit: boolean = false;

  private ww = window.document.documentElement.clientHeight;

  private loading = false;

  private treeLoading = false;

  private searchValue;

  private nodes: any = [];

  private selectLeaf: boolean = false;

  private router$: Subscription;

  @ViewChild("tree") tree: NzTreeBaseService;

  constructor(private dataService: DataService,
              public route: ActivatedRoute,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              @Inject(NzModalService)
              private modal: NzModalService,
              private dataHandler: DataHandlerService) {
  }

  ngOnInit(): void {
    this.router$ = this.route.params.subscribe((params) => {
      this.eruptBuildModel = null;
      this.showEdit = false;
      this.eruptName = params.name;
      this.fetchTreeData();
      this.dataService.getEruptBuild(this.eruptName).subscribe(em => {
        em.subErupts = null;
        this.dataHandler.initErupt(em);
        this.eruptBuildModel = em;
      });
    });
  }

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


  addBlock() {
    this.showEdit = true;
    this.loading = false;
    this.selectLeaf = false;
    if (this.tree.getSelectedNodeList()[0]) {
      this.tree.getSelectedNodeList()[0].isSelected = false;
    }
    this.dataHandler.emptyEruptValue(this.eruptBuildModel);
    this.dataHandler.loadEruptDefaultValue(this.eruptBuildModel.eruptModel);
  }

  addSub() {
    let eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
    let id = eruptFieldModelMap.get(this.eruptBuildModel.eruptModel.eruptJson.tree.id).eruptFieldJson.edit.$value;
    let label = eruptFieldModelMap.get(this.eruptBuildModel.eruptModel.eruptJson.tree.label).eruptFieldJson.edit.$value;
    this.addBlock();
    if (id) {
      let edit = eruptFieldModelMap.get(this.eruptBuildModel.eruptModel.eruptJson.tree.pid.split(".")[0]).eruptFieldJson.edit;
      edit.$value = id;
      edit.$viewValue = label;
    }
  }

  add() {
    if (this.dataHandler.validateNotNull(this.eruptBuildModel.eruptModel, this.eruptBuildModel.combineErupts)) {
      this.loading = true;
      this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
        this.loading = false;
        this.fetchTreeData();
        this.dataHandler.emptyEruptValue(this.eruptBuildModel);
        this.msg.success("添加成功");
      });
    }
  }

  save() {
    //校验菜单和合法性
    if (this.validateParentIdValue()) {
      if (this.dataHandler.validateNotNull(this.eruptBuildModel.eruptModel, this.eruptBuildModel.combineErupts)) {
        this.loading = true;
        this.dataService.editEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
          this.loading = false;
          this.msg.success("修改成功");
          this.fetchTreeData();
        });
      }
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
          this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName, nzTreeNode.origin.key).subscribe(function(data) {
            if (data.success) {
              that.fetchTreeData();
              that.msg.success("删除成功");
            } else {
              that.msg.error(data.message);
            }
          });
        }
      });

    } else {
      this.msg.error("存在叶节点不允许直接删除");
    }

  }

  nzDblClick(event: NzFormatEmitEvent) {
    event.node.setExpanded(!event.node.isExpanded);
    event.event.stopPropagation();
  }

  nodeClickEvent(event: NzFormatEmitEvent): void {
    this.selectLeaf = true;
    this.loading = true;
    this.showEdit = true;
    this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, event.node.origin.key).subscribe(data => {
      this.loading = false;
      this.dataHandler.objectToEruptValue(data, this.eruptBuildModel.eruptModel, this.eruptBuildModel.combineErupts);
    });

  }

}
