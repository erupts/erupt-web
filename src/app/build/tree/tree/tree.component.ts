import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { ActivatedRoute } from "@angular/router";
import { NzFormatEmitEvent, NzMessageService, NzModalService, NzTreeBaseService } from "ng-zorro-antd";
import { colRules } from "../../../erupt/model/util.model";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";
import { EruptAndEruptFieldModel, EruptBuildModel } from "../../../erupt/model/erupt-build.model";

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
    this.route.params.subscribe((params) => {
      this.eruptBuildModel = null;
      this.showEdit = false;
      this.eruptName = params.name;
      this.fetchTreeData();
      this.dataService.getEruptBuild(this.eruptName).subscribe(erupt => {
        erupt.subErupts = null;
        this.dataHandler.initErupt(erupt.eruptModel);
        erupt.combineErupts.forEach(ce => {
          this.dataHandler.initErupt(ce.eruptModel);
        });
        this.eruptBuildModel = erupt;
      });
    });
  }

  ngOnDestroy(): void {
    this.route.params.subscribe().unsubscribe();
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
    if (this.dataHandler.validateNotNull(this.eruptBuildModel.eruptModel, this.eruptBuildModel.combineErupts)) {
      this.loading = true;
      this.dataService.editEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
        this.loading = false;
        this.msg.success("修改成功");
        this.fetchTreeData();
      });
    }
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
