import { Component, Inject, Input, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Edit, EruptFieldModel } from "../model/erupt-field.model";
import { AttachmentEnum, ChoiceEnum, DateEnum, EditType, InputEnum } from "../model/erupt.enum";
import { DataService } from "../service/data.service";
import { ListSelectComponent } from "../list-select/list-select.component";
import { HelperService } from "../service/helper.service";
import { NzMessageService, UploadFile } from "ng-zorro-antd";
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

  @Input() size: "large" | "small" | "default" = "large";

  @Input() col = colRules[3];

  @Input() layout: "horizontal" | "vertical" = "vertical";

  @ViewChild("refFoot") refFoot;

  eruptFieldModels: Array<EruptFieldModel>;

  editType = EditType;

  choiceEnum = ChoiceEnum;

  dateEnum = DateEnum;

  attachmentEnum = AttachmentEnum;

  inputEnum = InputEnum;

  previewImage = null;

  previewVisible: boolean = false;

  constructor(private dataService: DataService, private helper: HelperService,
              @Inject(NzMessageService) private msg: NzMessageService, @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  ngOnInit() {
    this.eruptFieldModels = this.eruptModel.eruptFieldModels;
  }

  upLoadNzChange({ file, fileList }, field: EruptFieldModel) {
    const status = file.status;
    if (status === "done") {
      if (file.response.success) {
        field.eruptFieldJson.edit.$value = file.response.data;
      } else {
        this.msg.error(file.response.message);
        field.eruptFieldJson.edit.$tempValue.pop();
      }
      console.log(field.eruptFieldJson.edit.$tempValue);
    } else if (status === "error") {
      this.msg.error(`${file.name} 上传失败`);
    }
  }


  previewImageHandler = (file: UploadFile) => {
    console.log(file);
    this.dataService.downloadAttachment(file.response.data);
    this.previewImage = file.url || file.thumbUrl;
    this.previewVisible = true;
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
