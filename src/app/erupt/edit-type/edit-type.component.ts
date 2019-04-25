import { Component, Inject, Input, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Edit, EruptFieldModel } from "../model/erupt-field.model";
import { AttachmentEnum, ChoiceEnum, DateEnum, EditType, InputEnum } from "../model/erupt.enum";
import { DataService } from "../service/data.service";
import { ListSelectComponent } from "../list-select/list-select.component";
import { HelperService } from "../service/helper.service";
import { NzMessageService, NzModalService, UploadFile } from "ng-zorro-antd";
import { EruptModel } from "../model/erupt.model";
import { colRules } from "../model/util.model";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";

@Component({
  selector: "erupt-edit-type",
  templateUrl: "./edit-type.component.html",
  styleUrls: ["./edit-type.component.less"]
})
export class EditTypeComponent implements OnInit {

  //important
  @Input() eruptModel: EruptModel;

  @Input() col = colRules[3];

  @Input() size: "large" | "small" | "default" = "large";

  @Input() layout: "horizontal" | "vertical" = "vertical";

  eruptFieldModels: Array<EruptFieldModel>;

  editType = EditType;

  choiceEnum = ChoiceEnum;

  dateEnum = DateEnum;

  attachmentEnum = AttachmentEnum;

  inputEnum = InputEnum;

  constructor(public dataService: DataService, private helper: HelperService,
              @Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  ngOnInit() {
    this.eruptFieldModels = this.eruptModel.eruptFieldModels;
  }

  dependChange(value: number, field: EruptFieldModel) {
    const dsa = field.eruptFieldJson.edit.dependSwitchType[0].dependSwitchAttrs;
    dsa.forEach(attr => {
      if (value == attr.value) {
        attr.dependEdits.forEach(de => {
          const field = this.eruptModel.eruptFieldModelMap.get(de);
          if (field) {
            field.eruptFieldJson.edit.show = true;
          }
        });
      } else {
        attr.dependEdits.forEach(de => {
          const field = this.eruptModel.eruptFieldModelMap.get(de);
          if (field) {
            field.eruptFieldJson.edit.show = false;
          }
        });
      }
    });
  }

  upLoadNzChange({ file, fileList }, field: EruptFieldModel) {
    const status = file.status;
    if (status === "done") {
      if (file.response.success) {
        field.eruptFieldJson.edit.$value = file.response.data;
      } else {
        this.modal.error({
          nzTitle: "Error",
          nzContent: file.response.message
        });
        field.eruptFieldJson.edit.$tempValue.pop();
      }
    } else if (status === "error") {
      this.msg.error(`${file.name} 上传失败`);
    }
  }


  previewImageHandler = (file: UploadFile) => {
    if (file.url) {
      window.open(file.url);
    } else if (file.response && file.response.data) {
      window.open(DataService.previewAttachment(this.eruptModel.eruptName, file.response.data));
    }
  };


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
        field.eruptFieldJson.edit.$viewValue = tempVal.label;
        field.eruptFieldJson.edit.$value = tempVal.id;
      });
    });
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
