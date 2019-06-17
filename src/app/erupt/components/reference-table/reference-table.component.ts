import { Component, Inject, Input, OnInit } from "@angular/core";
import { DataService } from "../../service/data.service";
import { EruptModel } from "../../model/erupt.model";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DataHandlerService } from "../../service/data-handler.service";
import { BuildConfig } from "../../model/build-config";
import { RestPath } from "../../model/erupt.enum";

@Component({
  selector: "app-reference-table",
  templateUrl: "./reference-table.component.html",
  styles: []
})
export class ReferenceTableComponent implements OnInit {

  @Input() referenceEruptName: string;

  stConfig = BuildConfig.stConfig;

  searchErupt: EruptModel = null;

  hideCondition: boolean = true;

  eruptModel: EruptModel;

  columns: object[];

  constructor(private dataService: DataService,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              @Inject(NzModalService)
              private modal: NzModalService,
              private dataHandler: DataHandlerService) {
  }

  ngOnInit() {
    this.dataService.getEruptBuild(this.referenceEruptName).subscribe(em => {
      this.stConfig.url = RestPath.data + "table/" + this.referenceEruptName;
      this.eruptModel = em.eruptModel;
      this.buildTableConfig();
    });
  }


  buildTableConfig() {
    const _columns = [];
    _columns.push({
      title: "",
      type: "checkbox",
      fixed: "left",
      className: "text-center",
      index: this.eruptModel.eruptJson.primaryKeyCol
    });
    _columns.push({ title: "No", type: "no", fixed: "left", className: "text-center", width: "60px" });
    _columns.push(...this.dataHandler.viewToAlainTableConfig(this.eruptModel));
    this.columns = _columns;
  }

  tableDataChange() {

  }

  query() {

  }

}
