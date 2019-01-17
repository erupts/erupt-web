import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { NzFormatEmitEvent, NzTreeNode } from "ng-zorro-antd/tree";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { initErupt, objectToEruptValue, validateNotNull } from "../../../erupt/util/conver-util";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalRef, NzModalService } from "ng-zorro-antd";
import { colRules } from "../../../erupt/model/util.model";

@Component({
  selector: "app-tree",
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
              private modal: NzModalService) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.eruptModel = null;
      this.eruptName = params.name;
      this.dataService.getEruptBuild(this.eruptName).subscribe(erupt => {
        this.eruptModel = erupt.eruptModel;
        initErupt(erupt.eruptModel);
      });

      this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
        function gcZorroTree(nodes) {
          const tempNodes = [];
          nodes.forEach(node => {
            let option: any = {
              code: node.id,
              title: node.label,
              data: node.data
            };
            if (node.children && node.children.length > 0) {
              tempNodes.push(option);
              option.children = gcZorroTree(node.children);
            } else {
              option.isLeaf = true;
              tempNodes.push(option);
            }
          });
          return tempNodes;
        }

        if (tree) {
          this.nodes = gcZorroTree(tree);
        }

      });
    });
  }


  addBlock() {
    this.showEdit = true;
    this.loading = false;
    this.selectLeaf = false;
    if (this.tree.getSelectedNodeList()[0]) {
      this.tree.getSelectedNodeList()[0].setSelected(false);
    }
    objectToEruptValue(this.eruptModel, {});
  }

  add() {
    validateNotNull(this.eruptModel, this.msg);
  }

  save() {
    validateNotNull(this.eruptModel, this.msg);
  }

  del() {
    const that = this;
    const nzTreeNode: NzTreeNode = that.tree.getSelectedNodeList()[0];
    if (nzTreeNode.isLeaf) {
      this.dataService.deleteEruptData(this.eruptModel.eruptName, nzTreeNode.origin.code).subscribe(function(data) {
        if (data.success) {

        } else {
          that.msg.error(data.message);
        }
      });
    } else {
      this.msg.error("存在叶节点不允许直接删除");
    }

  }

  nzEvent(event: NzFormatEmitEvent): void {

  }

  nzContextMenu(event: NzFormatEmitEvent) {
    console.log(event);
  }

  nzDblClick(event: NzFormatEmitEvent) {
    event.node.setExpanded(!event.node.isExpanded);
  }

  nodeClickEvent(event: NzFormatEmitEvent): void {
    const that = this;
    this.selectLeaf = true;
    this.loading = true;
    this.dataService.queryEruptSingleData(this.eruptModel.eruptName, event.node.origin.code).subscribe(data => {
      that.loading = false;
      if (data.success) {
        this.showEdit = true;
        objectToEruptValue(this.eruptModel, data.data);
      } else {
        this.msg.error(data.message);
      }
    });

  }

}
