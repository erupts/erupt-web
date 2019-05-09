import { Component, Input, OnInit } from "@angular/core";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { DataService } from "../../../erupt/service/data.service";
import { TabEnum } from "../../../erupt/model/erupt.enum";
import { SettingsService } from "@delon/theme";
import { EruptAndEruptFieldModel } from "../../../erupt/model/erupt-page.model";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";

@Component({
  selector: "erupt-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.less"]
})
export class EditComponent implements OnInit {

  private rowData: any;

  private tabEnum = TabEnum;

  @Input() eruptModel: EruptModel;

  @Input() subErupts: Array<EruptAndEruptFieldModel>;

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Input() set rowDataFun(data: any) {
    if (data) {
      this.rowData = data;
      this.dataHandlerService.objectToEruptValue(this.eruptModel, data);
    } else {
      this.dataHandlerService.objectToEruptValue(this.eruptModel, {});
    }
    /**
     * TAB control
     */
    // 读取tab栏的数据
    if (this.rowData) {
      this.subErupts && this.subErupts.forEach(sub => {
        const tabType = sub.eruptFieldModel.eruptFieldJson.edit.tabType[0];
        switch (tabType.type) {
          case TabEnum.TREE:
            this.dataService.findTabTreeById(this.eruptModel.eruptName,
              this.rowData[this.eruptModel.eruptJson.primaryKeyCol], sub.eruptFieldModel.fieldName).subscribe(
              tree => {
                sub.eruptFieldModel.eruptFieldJson.edit.$value = tree;
              }
            );
            break;
          case TabEnum.TABLE:
            this.dataService.findTabListById(this.eruptModel.eruptName,
              this.rowData[this.eruptModel.eruptJson.primaryKeyCol], sub.eruptFieldModel.fieldName).subscribe(
              data => {
                sub.eruptFieldModel.eruptFieldJson.edit.$value = data;
              }
            );
            break;
        }
      });
    }
  }

  constructor(private dataService: DataService,
              private settingSrv: SettingsService,
              private dataHandlerService: DataHandlerService) {

  }

  ngOnInit() {
  }


  checkBoxChange(event, sub: EruptAndEruptFieldModel) {
    sub.eruptFieldModel.eruptFieldJson.edit.$value = event.keys;
  }


}
