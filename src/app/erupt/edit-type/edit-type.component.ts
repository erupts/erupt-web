import { Component, Inject, Input, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Edit, EruptFieldModel, ReferenceType } from "../model/erupt-field.model";
import { ChoiceEnum, DateEnum, EditType } from "../model/erupt.enum";
import { DataService } from "../service/data.service";
import { ListSelectComponent } from "../list-select/list-select.component";
import { HelperService } from "../service/helper.service";
import { NzMessageService } from "ng-zorro-antd";
import { EruptModel } from "../model/erupt.model";
import { colRules } from "../model/util.model";

@Component({
  selector: "erupt-edit-type",
  templateUrl: "./edit-type.component.html",
  styleUrls: ["./edit-type.component.less"]
})
export class EditTypeComponent implements OnInit {

  //important
  @Input() eruptModel: EruptModel;

  @Input() size: "large" | "small" | "default" = "large";

  eruptFieldModels: Array<EruptFieldModel>;

  editType = EditType;

  choiceEnum = ChoiceEnum;

  dateEnum = DateEnum;

  referenceLists: Array<ReferenceType>;


  @Input() col = colRules[3];

  @Input() layout: "horizontal" | "vertical" = "vertical";

  @ViewChild("refFoot") refFoot;


  constructor(private dataService: DataService, private helper: HelperService,
              @Inject(NzMessageService) private msg: NzMessageService) {
  }

  ngOnInit() {
    this.eruptFieldModels = this.eruptModel.eruptFieldModels;
  }


  createRefModal(field: EruptFieldModel) {
    this.dataService.queryEruptReferenceData(this.eruptModel.eruptName, field.fieldName).subscribe(data => {
      this.helper.modalHelper(ListSelectComponent, {
        list: data,
        eruptField: field,
        bodyStyle: {
          maxHeight: "440px"
        }
      }, field.eruptFieldJson.edit.title, "modal-xs", () => {
        const tempVal = field.eruptFieldJson.edit.$tempValue;
        if (tempVal == field.eruptModel) {

        }
        field.eruptFieldJson.edit.$viewValue = tempVal.label;
        field.eruptFieldJson.edit.$value = tempVal.id;
      });
    });

  }


  checkRefValue(edit: Edit) {
    // if (!edit.referenceType[0].tempVal) {
    //     // this.toastr.warning("未选中数据项", "");
    //     return;
    // }
    edit.$value = edit.referenceType[0].id;
    edit.$viewValue = edit.referenceType[0].label;
  }

  openModal(template: TemplateRef<any>) {
  }

  dateChange(event, field: EruptFieldModel) {
    console.log(event);
    field.eruptFieldJson.edit.$value = event.value;
    console.log(field.eruptFieldJson.edit.$value);
  }


  clearValue(field: EruptFieldModel, event: Event) {
    if (event) {
      event.stopPropagation();
    }
    field.eruptFieldJson.edit.$value = null;
    field.eruptFieldJson.edit.$viewValue = null;
    field.eruptFieldJson.edit.$tempValue = null;
  }


}
