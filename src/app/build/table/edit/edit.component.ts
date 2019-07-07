import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EditType, TabEnum } from "../../../erupt/model/erupt.enum";
import { SettingsService } from "@delon/theme";
import { EruptBuildModel } from "../../../erupt/model/erupt-build.model";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";
import { EruptFieldModel } from "../../../erupt/model/erupt-field.model";

@Component({
  selector: "erupt-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.less"]
})
export class EditComponent implements OnInit, OnDestroy {

  loading = false;

  editType = EditType;

  // private tabCount = new Subject<number>();

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Output() save = new EventEmitter();

  @Input() eruptBuildModel: EruptBuildModel;

  eruptFieldModelMap: Map<String, EruptFieldModel>;

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
    this.eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
  }

  ngOnDestroy(): void {
  }


  checkBoxChange(event, eruptFieldModel: EruptFieldModel) {
    eruptFieldModel.eruptFieldJson.edit.$value = event.keys;
  }


}
