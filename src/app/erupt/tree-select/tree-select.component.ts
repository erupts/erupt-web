import { Component, Input, OnInit } from "@angular/core";
import { EruptFieldModel, ReferenceType } from "../model/erupt-field.model";

@Component({
  selector: "app-tree-select",
  templateUrl: "./tree-select.component.html",
  styles: []
})
export class TreeSelectComponent implements OnInit {

  @Input() list: Array<ReferenceType>;

  @Input() eruptField: EruptFieldModel;

  @Input() bodyStyle: string;

  constructor() {

  }

  ngOnInit() {
  }

}
