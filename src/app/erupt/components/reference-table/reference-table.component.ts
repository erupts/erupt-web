import { Component, Inject, Input, OnInit } from "@angular/core";
import { DataService } from "../../service/data.service";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DataHandlerService } from "../../service/data-handler.service";
import { BuildConfig } from "../../model/build-config";
import { EruptModel } from "../../model/erupt.model";
import { RestPath } from "../../model/erupt.enum";
import { EruptFieldModel } from "../../model/erupt-field.model";

@Component({
  selector: "app-reference-table",
  templateUrl: "./reference-table.component.html",
  styles: []
})
export class ReferenceTableComponent implements OnInit {

  @Input() referenceErupt: EruptModel;

  @Input() eruptField: EruptFieldModel;

  @Input() erupt: EruptModel;

  stConfig = new BuildConfig().stConfig;

  searchErupt: EruptModel;

  hideCondition: boolean = false;

  columns: any[];

  selectRow: any;

  constructor(private dataService: DataService,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              @Inject(NzModalService)
              private modal: NzModalService,
              private dataHandler: DataHandlerService) {
  }

  ngOnInit() {
    this.stConfig.req.headers["erupt"] = this.erupt.eruptName;
    this.stConfig.url = RestPath.data + this.erupt.eruptName + "/reference-table/" + this.eruptField.fieldName;
    this.buildTableConfig();
    this.searchErupt = this.dataHandler.buildSearchErupt({ eruptModel: this.referenceErupt });
  }

  buildTableConfig() {
    const _columns = [];
    _columns.push({
      title: "", type: "radio", fixed: "left", width: "40px", className: "text-center",
      index: this.referenceErupt.eruptJson.primaryKeyCol
    });
    _columns.push(...this.dataHandler.viewToAlainTableConfig(this.referenceErupt));
    this.columns = _columns;
  }

  tableDataChange(event) {
    if (event.type === "radio") {
      console.log(event);
      // event.click.item.checked = true;
      this.selectRow = event.radio;
    }
  }

  query() {

  }

}
