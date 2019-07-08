import { Component, Inject, Input, OnInit, ViewChild } from "@angular/core";
import { EruptAndEruptFieldModel, EruptBuildModel } from "../../model/erupt-build.model";
import { DataService } from "../../service/data.service";
import { STComponent } from "@delon/abc";
import { EditTypeComponent } from "../../edit-type/edit-type.component";
import { colRules } from "../../model/util.model";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DataHandlerService } from "../../service/data-handler.service";

@Component({
  selector: "tab-table",
  templateUrl: "./tab-table.component.html",
  styles: []
})
export class TabTableComponent implements OnInit {

  @Input() eruptBuildModel: EruptBuildModel;

  @Input() tabErupt: EruptAndEruptFieldModel;

  @Input() behavior: "add" | "edit" | "readonly" = "add";

  @ViewChild("st") st: STComponent;

  private stConfig = {
    stPage: {
      placement: "center",
      pageSizes: [10, 30, 50, 100],
      showSize: true,
      showQuickJumper: true,
      total: true,
      toTop: true,
      front: true
    }
  };

  constructor(private dataService: DataService,
              private dataHandlerService: DataHandlerService,
              @Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService) {
  }

  ngOnInit() {
    if (!this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value) {
      this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value = [];
    }
    if (this.behavior == "readonly") {
      this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$viewValue = this.tabErupt.alainTableConfig;
    } else {
      const viewValue = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$viewValue = [];
      viewValue.push({
        title: "",
        type: "checkbox",
        fixed: "left",
        className: "text-center",
        index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
      });
      viewValue.push(...this.tabErupt.alainTableConfig);
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

  selectTableItem(event) {

  }


}
