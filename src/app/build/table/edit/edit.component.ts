import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EditType } from "../../../erupt/model/erupt.enum";
import { SettingsService } from "@delon/theme";
import { EruptBuildModel } from "../../../erupt/model/erupt-build.model";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";
import { EruptFieldModel } from "../../../erupt/model/erupt-field.model";
import { NzModalService } from "ng-zorro-antd";

@Component({
  selector: "erupt-edit",
  templateUrl: "./edit.component.html",
  styleUrls: ["./edit.component.less"]
})
export class EditComponent implements OnInit, OnDestroy {

  loading = false;

  editType = EditType;

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Output() save = new EventEmitter();

  @Input() eruptBuildModel: EruptBuildModel;

  @Input() id: any;

  eruptFieldModelMap: Map<String, EruptFieldModel>;

  constructor(
    @Inject(NzModalService)
    private modal: NzModalService,
    private dataService: DataService,
    private settingSrv: SettingsService,
    private dataHandlerService: DataHandlerService) {

  }

  ngOnInit() {
    this.loading = true;
    this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
    this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.id).subscribe(data => {
      console.log(data);
      this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
      this.loading = false;
    });

    this.eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
  }

  ngOnDestroy(): void {
  }


  checkBoxChange(event, eruptFieldModel: EruptFieldModel) {
    eruptFieldModel.eruptFieldJson.edit.$value = event.keys;
  }

}
