import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { Edit, EruptFieldModel } from "../model/erupt-field.model";
import { AttachmentEnum, ChoiceEnum, DateEnum, EditType } from "../model/erupt.enum";
import { DataService } from "../service/data.service";
import { TreeSelectComponent } from "../tree-select/tree-select.component";
import { NzMessageService, NzModalService, UploadFile } from "ng-zorro-antd";
import { EruptModel } from "../model/erupt.model";
import { colRules } from "../model/util.model";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { DatePipe } from "@angular/common";

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

  // ranges1 = { "今天": [new Date(), new Date()], "本月": [new Date(), endOfMonth(new Date())] };

  constructor(public dataService: DataService,
              private date: DatePipe,
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


  dateChange(date, edit: Edit) {
    if (this.eruptModel.mode === "search" && edit.search.vague) {
      if (edit.dateType.type == DateEnum.DATE) {
        edit.$value = [this.date.transform(date[0], "yyyy-MM-dd 00:00:00"), this.date.transform(date[1], "yyyy-MM-dd 23:59:59")];
      } else if (edit.dateType.type == DateEnum.DATE_TIME) {
        edit.$value = [this.date.transform(date[0], "yyyy-MM-dd hh:mm:ss"), this.date.transform(date[1], "yyyy-MM-dd hh:mm:ss")];
      }
    } else {
      let format = null;
      switch (edit.dateType.type) {
        case DateEnum.DATE:
          format = "yyyy-MM-dd";
          break;
        case DateEnum.DATE_TIME:
          format = "yyyy-MM-dd hh:mm:ss";
          break;
        case DateEnum.MONTH:
          format = "yyyy-MM";
          break;
        case DateEnum.WEEK:
          format = "yyyy-ww";
          break;
        case DateEnum.YEAR:
          format = "yyyy";
          break;
      }
      edit.$value = this.date.transform(date, format);
    }
  }


}
