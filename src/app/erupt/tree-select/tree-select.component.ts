import { Component, Input, OnInit } from "@angular/core";
import { EruptFieldModel, ReferenceTreeType } from "../model/erupt-field.model";
import { DataService } from "../service/data.service";
import { EruptModel } from "../model/erupt.model";
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

  @Input() bodyStyle: string;

  list: Array<ReferenceTreeType>;

  searchValue: string;

  constructor(private data: DataService, private dataHandler: DataHandlerService) {

  }

  ngOnInit() {
    this.data.queryRefTreeData(this.eruptModel.eruptName, this.eruptField.fieldName).subscribe(tree => {
      this.list = this.dataHandler.dataTreeToZorroTree(tree);
    });
  }

  nodeClickEvent(event: NzFormatEmitEvent) {
    this.eruptField.eruptFieldJson.edit.$tempValue = {
      id: event.node.origin.key,
      label: event.node.origin.title
    };
  }

}
