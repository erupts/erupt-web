import { Component, Inject, Input, OnInit, ViewChild } from "@angular/core";
import { EruptBuildModel } from "../../model/erupt-build.model";
import { DataService } from "../../service/data.service";
import { STColumn, STComponent } from "@delon/abc";
import { EditTypeComponent } from "../../edit-type/edit-type.component";
import { colRules } from "../../model/util.model";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DataHandlerService } from "../../service/data-handler.service";
import { EruptModel } from "../../model/erupt.model";
import { EruptFieldModel } from "../../model/erupt-field.model";
import { ReferenceTableComponent } from "../reference-table/reference-table.component";
import { BuildConfig } from "../../model/build-config";

@Component({
  selector: "tab-table",
  templateUrl: "./tab-table.component.html",
  styles: []
})
export class TabTableComponent implements OnInit {

  @Input() eruptBuildModel: EruptBuildModel;

  @Input() tabErupt: {
    eruptModel: EruptModel;
    eruptFieldModel: EruptFieldModel;
  };

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Input() mode: "refer-add" | "add" = "add";

  @ViewChild("st") st: STComponent;

  private stConfig = new BuildConfig().stConfig;

  constructor(private dataService: DataService,
              private dataHandlerService: DataHandlerService,
              @Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService) {
  }

  ngOnInit() {
    this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$viewValue = null;
    if (!this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value) {
      this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value = [];
    }
    if (this.behavior == "readonly") {
      this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$viewValue = this.dataHandlerService.viewToAlainTableConfig(this.tabErupt.eruptModel);
    } else {
      const viewValue: STColumn[] = [];
      viewValue.push({
        title: "",
        type: "checkbox",
        fixed: "left",
        className: "text-center",
        index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
      });
      viewValue.push(...this.dataHandlerService.viewToAlainTableConfig(this.tabErupt.eruptModel));
      viewValue.push({
        title: "操作区",
        fixed: "right",
        width: "150px",
        className: "text-center",
        buttons: [
          {
            icon: "edit",
            click: (record: any, modal: any, comp: STComponent) => {
              this.modal.create({
                nzWrapClassName: "modal-md",
                nzStyle: { top: "20px" },
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: "编辑",
                nzContent: EditTypeComponent,
                nzComponentParams: {
                  eruptModel: this.tabErupt.eruptModel,
                  col: colRules[2]
                },
                nzOnOk: () => {
                  let obj = this.dataHandlerService.eruptValueToObject({ eruptModel: this.tabErupt.eruptModel });
                }
              });
            }
          },
          {
            icon: {
              type: "delete",
              theme: "twotone",
              twoToneColor: "#f00"
            },
            type: "del",
            click: (record, modal, comp: STComponent) => {
              comp.removeRow(record);
            }
          }
        ]
      });
      this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$viewValue = viewValue;
    }
  }

  addData() {
    this.modal.create({
      nzWrapClassName: "modal-md",
      nzStyle: { top: "50px" },
      nzMaskClosable: false,
      nzKeyboard: false,
      nzTitle: "新增",
      nzContent: EditTypeComponent,
      nzComponentParams: {
        eruptBuildModel: {
          eruptModel: this.tabErupt.eruptModel
        }
      },
      nzOnOk: () => {
        // let obj = this.dataHandlerService.eruptValueToObject({
        //   eruptModel: this.tabErupt.eruptModel
        // });
        // this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value.push(obj);
        // this.st.reload();
      }
    });
  }

  deleteData() {
    const tempValue = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$tempValue;
    if (tempValue && tempValue.length > 0) {
      const val = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
    } else {
      this.msg.warning("请选中要删除的数据");
    }
  }

  addDataByRefer() {
    this.modal.create({
      nzStyle: { top: "20px" },
      nzWrapClassName: "modal-lg",
      nzMaskClosable: false,
      nzKeyboard: false,
      nzTitle: "新增",
      nzContent: ReferenceTableComponent,
      nzComponentParams: {
        erupt: this.eruptBuildModel.eruptModel,
        referenceErupt: this.tabErupt.eruptModel,
        eruptField: this.tabErupt.eruptFieldModel,
        mode: "checkbox"
      },
      nzOkText: "增加",
      nzOnOk: () => {
        let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
        edit.$value = edit.$tempValue;
      }
    });
  }

  selectTableItem(event) {

  }


}
