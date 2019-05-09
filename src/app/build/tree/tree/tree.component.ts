import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { NzFormatEmitEvent, NzTreeNode } from "ng-zorro-antd/tree";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { colRules } from "../../../erupt/model/util.model";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";

@Component({
  selector: "erupt-tree",
  templateUrl: "./tree.component.html",
  styleUrls: ["./tree.component.less"]
})
export class TreeComponent implements OnInit {

  private colRules = colRules;

  private eruptName: string;

  public eruptModel: EruptModel;

  private showEdit: boolean = false;

  private ww = window.document.documentElement.clientHeight;

  private loading = false;

  private searchValue;

  private nodes: any = [];

  private selectLeaf: boolean = false;

  @ViewChild("tree") tree;

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
      this.eruptModel = null;
      this.showEdit = false;
      this.eruptName = params.name;
      this.fetchTreeData();
      this.dataService.getEruptBuild(this.eruptName).subscribe(erupt => {
        this.eruptModel = erupt.eruptModel;
        this.dataHandler.initErupt(erupt.eruptModel);
      });
    });
  }

  fetchTreeData() {
    this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
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
      this.tree.getSelectedNodeList()[0].setSelected(false);
    }
    this.dataHandler.emptyEruptValue(this.eruptModel);
    // objectToEruptValue(this.eruptModel, {});
  }

  add() {
    if (this.dataHandler.validateNotNull(this.eruptModel)) {
      this.dataService.addEruptData(this.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptModel)).subscribe(result => {
        if (result.success) {

          this.fetchTreeData();
          this.msg.success("添加成功");
        } else {
          this.msg.error(result.message);
        }
      });
    }
  }

  save() {
    if (this.dataHandler.validateNotNull(this.eruptModel)) {
      this.dataService.editEruptData(this.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptModel)).subscribe(result => {
        if (result.success) {
          this.fetchTreeData();
          this.msg.success("修改成功");
        } else {
          this.msg.error(result.message);
        }
      });
    }
  }

  del() {
    const that = this;
    const nzTreeNode: NzTreeNode = that.tree.getSelectedNodeList()[0];
    if (nzTreeNode.isLeaf) {
      this.modal.confirm({
        nzTitle: "请确认是否要删除",
        nzContent: "",
        nzOnOk: () => {
          this.dataService.deleteEruptData(this.eruptModel.eruptName, nzTreeNode.origin.key).subscribe(function(data) {
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
    const that = this;
    this.selectLeaf = true;
    this.loading = true;
    this.dataService.queryEruptDataById(this.eruptModel.eruptName, event.node.origin.key).subscribe(data => {
      that.loading = false;
      if (data.success) {
        this.showEdit = true;
        this.dataHandler.objectToEruptValue(this.eruptModel, data.data);
      } else {
        this.msg.error(data.message);
      }
    });

  }

}
