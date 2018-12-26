import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { NzFormatEmitEvent } from "ng-zorro-antd/tree";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { eruptValueToObject, objectToEruptValue, validateNotNull } from "../../../erupt/util/conver-util";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalRef, NzModalService } from "ng-zorro-antd";
import { EditTypeComponent } from "../../../erupt/edit-type/edit-type.component";

@Component({
  selector: "app-tree",
  templateUrl: "./tree.component.html",
  styleUrls: ["./tree.component.less"]
})
export class TreeComponent implements OnInit {

  eruptName: string = "";

  eruptModel: EruptModel;

  private addModal: NzModalRef;


  constructor(private dataService: DataService,
              public route: ActivatedRoute,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              @Inject(NzModalService)
              private modal: NzModalService) {
  }

  @ViewChild("treeCom") treeCom;
  searchValue;

  nodes: any = [];


  addRoot() {
    this.addModal = this.modal.create({
      nzWrapClassName: "modal-lg",
      nzTitle: "新增",
      nzContent: EditTypeComponent,
      nzComponentParams: {
        // @ts-ignore
        eruptFieldModels: this.eruptModel.eruptFieldModels,
        eruptName: this.eruptName,
        behavior: "edit"
      },
      nzOnOk: () => {
        console.log(this.addModal);
        if (validateNotNull(this.eruptModel, this.msg)) {
          this.dataService.addEruptData(this.eruptModel.eruptName, eruptValueToObject(this.eruptModel, this.msg)).subscribe(result => {
            alert(result);
          });
        } else {
          return false;
        }
      }
    });
  }

  nzEvent(event: NzFormatEmitEvent): void {
    console.log(event, this.treeCom.getMatchedNodeList().map(v => v.title));
  }

  nodeClickEvent(event: NzFormatEmitEvent): void {
    objectToEruptValue(this.eruptModel, event.node.origin.data);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      console.log(params);
      this.eruptName = params.name;
    });

    this.dataService.getEruptBuild(this.eruptName).subscribe(erupt => {
      this.eruptModel = erupt;
    });

    this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
      console.log(tree);

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
  }

}
