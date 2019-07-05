import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { TabEnum } from "../../../erupt/model/erupt.enum";
import { SettingsService } from "@delon/theme";
import { EruptAndEruptFieldModel, EruptBuildModel } from "../../../erupt/model/erupt-build.model";
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

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Output() save = new EventEmitter();

  @Input() eruptBuildModel: EruptBuildModel;

  eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;

  constructor(private dataService: DataService,
              private settingSrv: SettingsService,
              private dataHandlerService: DataHandlerService) {

  }

  @Input() set setIdData(id: any) {
    this.loading = true;
    this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
    this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, id).subscribe(data => {
      this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
      this.loading = false;
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
