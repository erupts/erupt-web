import { Component, Input, OnInit } from "@angular/core";
import { EruptFieldModel, ReferenceTreeType } from "../model/erupt-field.model";

@Component({
  selector: "app-tree-select",
  templateUrl: "./tree-select.component.html",
  styles: []
})
export class TreeSelectComponent implements OnInit {

  @Input() list: Array<ReferenceTreeType>;

  @Input() eruptField: EruptFieldModel;

  @Input() bodyStyle: string;

  constructor() {

  }

  ngOnInit() {
  }

}
