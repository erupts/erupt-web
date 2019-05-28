import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
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
export class EditComponent implements OnInit, OnDestroy {

  tabEnum = TabEnum;

  loading = false;

  // private tabCount = new Subject<number>();

  @Input() eruptModel: EruptModel;

  @Input() subErupts: Array<EruptAndEruptFieldModel>;

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Output() save = new EventEmitter();

  @Input() combineErupts: Array<EruptAndEruptFieldModel>;

  constructor(private dataService: DataService,
              private settingSrv: SettingsService,
              private dataHandlerService: DataHandlerService) {

  }

  @Input() set setIdData(id: any) {
    this.loading = true;
    this.dataHandlerService.emptyEruptValue(this.eruptModel, this.subErupts);
    this.dataService.queryEruptDataById(this.eruptModel.eruptName, id).subscribe(data => {
      this.dataHandlerService.objectToEruptValue(this.eruptModel, data);
      this.loading = false;
    });
    //TAB control
    this.subErupts && this.subErupts.forEach(sub => {
      const tabType = sub.eruptFieldModel.eruptFieldJson.edit.tabType;
      switch (tabType.type) {
        case TabEnum.TREE:
          this.dataService.findTabTreeById(this.eruptModel.eruptName, id, sub.eruptFieldModel.fieldName).subscribe(tree => {
              sub.eruptFieldModel.eruptFieldJson.edit.$value = tree;
              this.eruptModel.tabLoadCount++;
            }
          );
          break;
        case TabEnum.TABLE:
          this.dataService.findTabListById(this.eruptModel.eruptName, id, sub.eruptFieldModel.fieldName).subscribe(data => {
              sub.eruptFieldModel.eruptFieldJson.edit.$value = data;
              this.eruptModel.tabLoadCount++;
            }
          );
          break;
      }
    });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }


  checkBoxChange(event, sub: EruptAndEruptFieldModel) {
    sub.eruptFieldModel.eruptFieldJson.edit.$value = event.keys;
  }


}
