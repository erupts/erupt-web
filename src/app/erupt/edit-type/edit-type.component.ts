import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { Edit, EruptFieldModel } from "../model/erupt-field.model";
import { AttachmentEnum, ChoiceEnum, DateEnum, DependSwitchTypeEnum, EditType } from "../model/erupt.enum";
import { DataService } from "../service/data.service";
import { TreeSelectComponent } from "../components/tree-select/tree-select.component";
import { NzMessageService, NzModalService, UploadFile } from "ng-zorro-antd";
import { EruptModel } from "../model/erupt.model";
import { colRules } from "../model/util.model";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { DatePipe } from "@angular/common";
import { ReferenceTableComponent } from "../components/reference-table/reference-table.component";
import { EruptBuildModel } from "../model/erupt-build.model";
import { EruptApiModel, Status } from "../model/erupt-api.model";
import { DataHandlerService } from "../service/data-handler.service";
import { UtilsService } from "../service/utils.service";

@Component({
  selector: "erupt-edit-type",
  templateUrl: "./edit-type.component.html",
  styleUrls: ["./edit-type.component.less"]
})
export class EditTypeComponent implements OnInit {

  //important
  @Input() eruptBuildModel: EruptBuildModel;

  //UI
  @Input() col = colRules[3];

  //UI
  @Input() size: "large" | "small" | "default" = "large";

  //UI
  @Input() layout: "horizontal" | "vertical" = "vertical";

  //Behavior
  @Input() mode: "addNew" | null;

  @Input() parentEruptName: string;

  //event
  @Output() search = new EventEmitter();

  eruptModel: EruptModel;

  editType = EditType;

  choiceEnum = ChoiceEnum;

  dateEnum = DateEnum;

  attachmentEnum = AttachmentEnum;

  dateRanges: object = null;

  uploadFilesStatus: { [key: string]: boolean } = {};

  private datePipe: DatePipe = new DatePipe("zh-cn");

  constructor(public dataService: DataService,
              public dataHandlerService: DataHandlerService,
              public utilsService: UtilsService,
              @Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  ngOnInit() {
    this.eruptModel = this.eruptBuildModel.eruptModel;
    this.dateRanges = {
      "今天": [this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")]
    };
    if (this.mode === "addNew") {
      this.dataHandlerService.loadEruptDefaultValue(this.eruptBuildModel);
    }
    this.eruptModel.eruptFieldModels.forEach(field => {
      switch (field.eruptFieldJson.edit.type) {
        case EditType.HTML:
          this.dataService.getEruptFieldHtml(this.eruptModel.eruptName, field.fieldName).subscribe(res => {
            let html = this.utilsService.analyseHtml(res);
            field.eruptFieldJson.edit.$viewValue = html;
          });
          break;
      }
    });
  }

  eruptEditValidate(): boolean {
    for (let key in this.uploadFilesStatus) {
      if (!this.uploadFilesStatus[key]) {
        this.msg.warning("附件上传中请稍后");
        return false;
      }
    }
    return true;
  }

  enterEvent(event) {
    if (event.which === 13) {
      this.search.emit();
    }
  }

  dependChange(value: number, field: EruptFieldModel) {
    const dsa = field.eruptFieldJson.edit.dependSwitchType.attr;
    const type = field.eruptFieldJson.edit.dependSwitchType.type;
    dsa.forEach(attr => {
      if (value === attr.value) {
        attr.dependEdits.forEach(de => {
          const field = this.eruptModel.eruptFieldModelMap.get(de);
          if (field) {
            if (type === DependSwitchTypeEnum.HIDDEN) {
              field.eruptFieldJson.edit.show = true;
            } else {
              field.eruptFieldJson.edit.readOnly = false;
            }

          }
        });
      } else {
        attr.dependEdits.forEach(de => {
          const field = this.eruptModel.eruptFieldModelMap.get(de);
          if (field) {
            if (type == DependSwitchTypeEnum.HIDDEN) {
              field.eruptFieldJson.edit.show = false;
            } else {
              field.eruptFieldJson.edit.readOnly = true;
            }
          }
        });
      }
    });
  }

  upLoadNzChange({ file, fileList }, field: EruptFieldModel) {
    const status = file.status;
    if (file.status === "uploading") {
      this.uploadFilesStatus[file.uid] = false;
    }
    if (status === "done") {
      this.uploadFilesStatus[file.uid] = true;
      if ((<EruptApiModel>file.response).status === Status.ERROR) {
        this.modal.error({
          nzTitle: "ERROR",
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
      window.open(DataService.previewAttachment(file.response.data));
    }
  };


  createRefTreeModal(field: EruptFieldModel) {
    let depend = field.eruptFieldJson.edit.referenceTreeType.dependField;
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
        parentEruptName: this.parentEruptName,
        eruptModel: this.eruptModel,
        eruptField: field,
        dependVal: dependVal
      }, nzOnOk: () => {
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

  createRefTableModal(field: EruptFieldModel) {
    let model = this.modal.create({
      nzWrapClassName: "modal-lg",
      nzKeyboard: true,
      nzStyle: { top: "35px" },
      nzTitle: field.eruptFieldJson.edit.title,
      nzCancelText: "取消（ESC）",
      nzContent: ReferenceTableComponent,
      nzComponentParams: {
        erupt: this.eruptModel,
        eruptField: field,
        referenceErupt: this.eruptBuildModel.referenceErupts[field.fieldName],
        parentEruptName: this.parentEruptName
      }, nzOnOk: () => {
        let radioValue = model.getContentComponent().radioValue;
        if (!radioValue) {
          this.msg.warning("请选中一条数据");
          return false;
        }
        field.eruptFieldJson.edit.$value = radioValue[field.eruptFieldJson.edit.referenceTableType.id];
        field.eruptFieldJson.edit.$viewValue = radioValue[field.eruptFieldJson.edit.referenceTableType.label];
        field.eruptFieldJson.edit.$tempValue = radioValue;
      }
    });
  }

  changeTagAll($event, field: EruptFieldModel) {
    for (let vl of field.eruptFieldJson.edit.choiceType.vl) {
      vl.$viewValue = $event;
    }
  }

  clearReferValue(field: EruptFieldModel) {
    field.eruptFieldJson.edit.$value = null;
    field.eruptFieldJson.edit.$viewValue = null;
    field.eruptFieldJson.edit.$tempValue = null;
  }


  dateChange(date, edit: Edit) {
    if (!date || date.length == 0) {
      edit.$value = null;
      return;
    }
    if (this.eruptModel.mode === "search" && edit.search.vague) {
      if (edit.dateType.type == DateEnum.DATE) {
        edit.$value = [this.datePipe.transform(date[0], "yyyy-MM-dd 00:00:00"), this.datePipe.transform(date[1], "yyyy-MM-dd 23:59:59")];
      } else if (edit.dateType.type == DateEnum.DATE_TIME) {
        edit.$value = [this.datePipe.transform(date[0], "yyyy-MM-dd hh:mm:ss"), this.datePipe.transform(date[1], "yyyy-MM-dd hh:mm:ss")];
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
      edit.$value = this.datePipe.transform(date, format);
    }
  }


}
