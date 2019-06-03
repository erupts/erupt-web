import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { EruptFieldModel } from "../model/erupt-field.model";
import { AttachmentEnum, ChoiceEnum, DateEnum, EditType } from "../model/erupt.enum";
import { DataService } from "../service/data.service";
import { TreeSelectComponent } from "../tree-select/tree-select.component";
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

  @Output() search = new EventEmitter();

  editType = EditType;

  choiceEnum = ChoiceEnum;

  dateEnum = DateEnum;

  attachmentEnum = AttachmentEnum;

  constructor(public dataService: DataService,
              @Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  ngOnInit() {

  }

  enterEvent(event) {
    if (event.which === 13) {
      this.search.emit();
    }
  }

  dependChange(value: number, field: EruptFieldModel) {
    const dsa = field.eruptFieldJson.edit.dependSwitchType.dependSwitchAttrs;
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
      console.log(file);
      if (!file.response.success) {
        this.modal.error({
          nzTitle: "Error",
          nzContent: file.response.message
        });
        field.eruptFieldJson.edit.$viewValue.pop();
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


  createTreeRefModal(field: EruptFieldModel) {
    let depend = field.eruptFieldJson.edit.referenceTreeType.depend;
    let dependVal = null;
    if (depend) {
      const dependField: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(depend);
      if (dependField.eruptFieldJson.edit.$value) {
        dependVal = dependField.eruptFieldJson.edit.$value;
      } else {
        this.msg.warning("请先选择" + dependField.eruptFieldJson.edit.title);
        return;
      }
    }
    this.modal.create({
      nzWrapClassName: "modal-xs",
      nzKeyboard: true,
      nzStyle: { top: "30px" },
      nzTitle: field.eruptFieldJson.edit.title,
      nzCancelText: "取消（ESC）",
      nzContent: TreeSelectComponent,
      nzComponentParams: {
        eruptModel: this.eruptModel,
        eruptField: field,
        dependVal: dependVal
      }, nzOnOk: () => {
        console.log(field.eruptFieldJson.edit.$value);
        const tempVal = field.eruptFieldJson.edit.$tempValue;
        if (!tempVal) {
          this.msg.warning("请选中一条数据");
          return false;
        }
        field.eruptFieldJson.edit.$viewValue = tempVal.label;
        field.eruptFieldJson.edit.$value = tempVal.id;
        field.eruptFieldJson.edit.$tempValue = null;
      }
    });


  }


  checkboxChange(val: string[], field: EruptFieldModel) {
    field.eruptFieldJson.edit.$value = val.join(field.eruptFieldJson.edit.choiceType.joinSeparator);
  }

  clearValue(field: EruptFieldModel) {
    field.eruptFieldJson.edit.$value = null;
    field.eruptFieldJson.edit.$viewValue = null;
    field.eruptFieldJson.edit.$tempValue = null;
  }


}
