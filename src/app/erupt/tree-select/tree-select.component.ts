import { Component, Input, OnInit } from "@angular/core";
import { EruptFieldModel, ReferenceTreeType } from "../model/erupt-field.model";
import { DataService } from "../service/data.service";
import { EruptModel, Tree } from "../model/erupt.model";
import { DataHandlerService } from "../service/data-handler.service";
import { NzFormatEmitEvent } from "ng-zorro-antd";

@Component({
  selector: "app-tree-select",
  templateUrl: "./tree-select.component.html",
  styles: []
})
export class TreeSelectComponent implements OnInit {

  @Input() eruptField: EruptFieldModel;

  @Input() eruptModel: EruptModel;

  @Input() dependVal: any;

  list: Tree[];

  searchValue: string;

  constructor(private data: DataService, private dataHandler: DataHandlerService) {

  }

  ngOnInit() {
    if (this.dependVal) {
      this.data.queryRefTreeDataByDepend(this.eruptModel.eruptName, this.eruptField.fieldName, this.dependVal).subscribe(tree => {
        this.list = this.dataHandler.dataTreeToZorroTree(tree);
      });
    } else {
      this.data.queryRefTreeData(this.eruptModel.eruptName, this.eruptField.fieldName).subscribe(tree => {
        this.list = this.dataHandler.dataTreeToZorroTree(tree);
      });
    }

  }

  nodeClickEvent(event: NzFormatEmitEvent) {
    this.eruptField.eruptFieldJson.edit.$tempValue = {
      id: event.node.origin.key,
      label: event.node.origin.title
    };
  }

}
