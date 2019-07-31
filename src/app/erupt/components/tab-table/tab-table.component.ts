import { Component, Inject, Input, OnInit, ViewChild } from "@angular/core";
import { EruptBuildModel } from "../../model/erupt-build.model";
import { DataService } from "../../service/data.service";
import { STColumn, STColumnButton, STComponent } from "@delon/abc";
import { EditTypeComponent } from "../../edit-type/edit-type.component";
import { colRules } from "../../model/util.model";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DataHandlerService } from "../../service/data-handler.service";
import { EruptFieldModel } from "../../model/erupt-field.model";
import { ReferenceTableComponent } from "../reference-table/reference-table.component";
import { BuildConfig } from "../../model/build-config";
import { Status } from "../../model/erupt-api.model";

@Component({
  selector: "tab-table",
  templateUrl: "./tab-table.component.html",
  styles: []
})
export class TabTableComponent implements OnInit {

  @Input() eruptBuildModel: EruptBuildModel;

  @Input() tabErupt: {
    eruptBuildModel: EruptBuildModel;
    eruptFieldModel: EruptFieldModel;
  };

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @Input() mode: "refer-add" | "add" = "add";

  @ViewChild("st") st: STComponent;

  column: STColumn[];

  checkedRow = [];

  private stConfig = new BuildConfig().stConfig;

  constructor(private dataService: DataService,
              private dataHandlerService: DataHandlerService,
              @Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService) {
  }

  ngOnInit() {
    this.stConfig.stPage.front = true;
    if (!this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value) {
      this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value = [];
    }
    if (this.behavior == "readonly") {
      this.column = this.dataHandlerService.viewToAlainTableConfig(this.tabErupt.eruptBuildModel.eruptModel, false);
    } else {
      const viewValue: STColumn[] = [];
      viewValue.push({
        title: "",
        type: "checkbox",
        fixed: "left",
        className: "text-center",
        index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
      });
      viewValue.push(...this.dataHandlerService.viewToAlainTableConfig(this.tabErupt.eruptBuildModel.eruptModel, false));
      let operators: STColumnButton[] = [];
      if (this.mode == "add") {
        operators.push({
          icon: "edit",
          click: (record: any, modal: any, comp: STComponent) => {
            this.dataHandlerService.objectToEruptValue(record, this.tabErupt.eruptBuildModel);
            this.modal.create({
              nzWrapClassName: "modal-md",
              nzStyle: { top: "20px" },
              nzMaskClosable: false,
              nzKeyboard: false,
              nzTitle: "编辑",
              nzContent: EditTypeComponent,
              nzComponentParams: {
                col: colRules[2],
                eruptBuildModel: this.tabErupt.eruptBuildModel,
                parentEruptName: this.eruptBuildModel.eruptModel.eruptName
              },
              nzOnOk: () => {
                let obj = this.dataHandlerService.eruptValueToObject(this.tabErupt.eruptBuildModel);
                let $value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
                $value.forEach((val, index) => {
                  let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
                  if (record[tabPrimaryKeyCol] == val[tabPrimaryKeyCol]) {
                    $value[index] = obj;
                  }
                });
                this.st.reload();
              }
            });
          }
        });
      }
      operators.push({
        icon: {
          type: "delete",
          theme: "twotone",
          twoToneColor: "#f00"
        },
        type: "del",
        click: (record, modal, comp: STComponent) => {
          let $value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
          for (let i in <any[]>$value) {
            let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
            if (record[tabPrimaryKeyCol] == $value[i][tabPrimaryKeyCol]) {
              $value.splice(i, 1);
              break;
            }
          }
          this.st.reload();
        }
      });
      viewValue.push({
        title: "操作区",
        fixed: "right",
        width: "150px",
        className: "text-center",
        buttons: operators
      });
      this.column = viewValue;
    }
  }

  addData() {
    this.modal.create({
      nzWrapClassName: "modal-md",
      nzStyle: { top: "50px" },
      nzMaskClosable: false,
      nzKeyboard: false,
      nzTitle: "添加",
      nzContent: EditTypeComponent,
      nzComponentParams: {
        mode: "addNew",
        eruptBuildModel: this.tabErupt.eruptBuildModel,
        parentEruptName: this.eruptBuildModel.eruptModel.eruptName
      },
      nzOnOk: async () => {
        let obj = this.dataHandlerService.eruptValueToObject(this.tabErupt.eruptBuildModel);
        let result = await this.dataService.eruptDataValidate(this.tabErupt.eruptBuildModel.eruptModel.eruptName, obj).toPromise().then(resp => resp);
        if (result.status == Status.SUCCESS) {
          obj[this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol] = -Math.floor(Math.random() * 1000);
          let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
          let tableData = this.dataHandlerService.eruptObjectToTableValue(this.tabErupt.eruptBuildModel, obj);
          edit.$value.push(tableData);
          this.st.reload();
          return true;
        } else {
          return false;
        }
      }
    });
  }

  addDataByRefer() {
    const modal = this.modal.create({
      nzStyle: { top: "20px" },
      nzWrapClassName: "modal-lg",
      nzMaskClosable: false,
      nzKeyboard: false,
      nzTitle: "新增",
      nzContent: ReferenceTableComponent,
      nzComponentParams: {
        erupt: this.eruptBuildModel.eruptModel,
        referenceErupt: this.tabErupt.eruptBuildModel.eruptModel,
        eruptField: this.tabErupt.eruptFieldModel,
        mode: "checkbox"
      },
      nzOkText: "增加",
      nzOnOk: () => {
        let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
        edit.$value.push(...modal.getContentComponent().checkedValues);
        this.st.reload();
      }
    });
  }

  selectTableItem(event) {
    if (event.type === "checkbox") {
      this.checkedRow = event.checkbox;
    }
  }

  deleteData() {
    if (this.checkedRow.length) {
      let value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
      for (let i in <any[]>value) {
        let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
        this.checkedRow.forEach((cr) => {
          if (cr[tabPrimaryKeyCol] == value[i][tabPrimaryKeyCol]) {
            value.splice(i, 1);
          }
        });
      }
      this.st.reload();
      this.checkedRow = [];
    } else {
      this.msg.warning("请选中要删除的数据");
    }
  }


}
