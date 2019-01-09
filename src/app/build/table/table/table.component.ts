import { Component, Inject, OnInit, Renderer2, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { EruptFieldModel } from "../../../erupt/model/erupt-field.model";
import {
  emptyEruptValue,
  eruptValueToObject,
  initErupt,
  validateNotNull,
  viewToAlainTableConfig
} from "../../../erupt/util/conver-util";
import { DrawerHelper, ModalHelper, SettingsService } from "@delon/theme";
import { EditTypeComponent } from "../../../erupt/edit-type/edit-type.component";
import { EditComponent } from "../edit/edit.component";
import { STData, STReq } from "@delon/abc";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { EruptAndEruptFieldModel } from "../../../erupt/model/erupt-page.model";

@Component({
  selector: "app-list-view",
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.less"]
})
export class TableComponent implements OnInit {

  constructor(private dataService: DataService,
              private settingSrv: SettingsService,
              private modalHelper: ModalHelper,
              private drawerHelper: DrawerHelper,
              private renderer: Renderer2,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              @Inject(NzModalService)
              private modal: NzModalService,
              public route: ActivatedRoute,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService
  ) {
  }

  searchErupt: EruptModel;

  eruptModel: EruptModel;

  subErupts: Array<EruptAndEruptFieldModel>;

  eruptName: string;

  stPage = {
    pageSizes: [10, 30, 50, 100],
    showSize: true,
    showQuickJumper: true,
    total: true,
    toTop: true,
    front: false
  };

  reqConfig: STReq = {
    method: "POST",
    allInBody: true,
    reName: {
      pi: "pageIndex",
      ps: "pageSize"
    }
  };

  selectedRows: Array<any> = [];

  columns = [];

  @ViewChild("st") st;

  url: string;

  ngOnInit() {
    this.columns = [];
    this.route.params.subscribe(params => {
      this.eruptName = params.name;
      this.url = this.dataService.domain + "/erupt-api/data/table/" + this.eruptName;
      this.dataService.getEruptBuild(this.eruptName).subscribe(
        em => {
          this.eruptModel = em.eruptModel;
          this.subErupts = em.subErupts;
          initErupt(this.eruptModel);
          this.buildTableConfig();
          this.searchErupt = {
            eruptFieldModels: [],
            eruptJson: this.eruptModel.eruptJson,
            eruptName: this.eruptModel.eruptName
          };
          em.eruptModel.eruptFieldModels.forEach((field, i) => {
            //search Edit
            if (field.eruptFieldJson.edit.search.isSearch) {
              field.eruptFieldJson.edit.notNull = false;
              this.searchErupt.eruptFieldModels.push(field);
            }
          });
          em.subErupts.forEach((fe => {
            initErupt(fe.eruptModel);
            fe.alainTableConfig = viewToAlainTableConfig(fe.eruptModel.tableColumns);
          }));
        }
      );
    });
  }

  buildTableConfig() {
    this.columns.push({ title: "", type: "checkbox", fixed: "left", index: this.eruptModel.eruptJson.primaryKeyCol });
    this.columns.push({ title: "No", type: "no", fixed: "left", width: "60px" });
    this.columns.push(...viewToAlainTableConfig(this.eruptModel.tableColumns));
    const operators = [];
    this.eruptModel.eruptJson.rowOperation.forEach(ro => {
      if (!ro.multi) {
        const that = this;
        operators.push({
          icon: ro.icon,
          click: (record: any, modal: any) => {
            that.gcOperatorEdits(ro.code, false, record);
          }
        });
      }
    });

    if (operators.length > 0) {
      this.columns.push({
        title: "功能",
        className: "text-center",
        fixed: "right",
        width: "100px",
        buttons: [...operators]
      });
    }

    this.columns.push({
      fixed: "right",
      width: "100px",
      title: "操作区",
      buttons: [
        {
          icon: "edit",
          click: (record: any, modal: any) => {
            this.drawerHelper.static("编辑", EditComponent, {
              eruptModel: this.eruptModel,
              subErupts: this.subErupts,
              rowDataFun: record
            }, {
              footer: false,
              size: "lg"
            }).subscribe(s => {

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
          click: (record, modal, comp) => {
            this.dataService.deleteEruptData(this.eruptName, record[this.eruptModel.eruptJson.primaryKeyCol]).subscribe(result => {
              if (result.success) {
                comp.removeRow(record);
                this.msg.success("删除成功");
              } else {
                this.msg.error(result.message);
              }
            });

          }
        }
      ]
    });
  }


  /**
   * @param code 编码
   * @param data 数据（单个执行时使用）
   */
  gcOperatorEdits(code: string, multi: boolean, data?: object) {
    if (multi) {
      if (!this.selectedRows || this.selectedRows.length == 0) {
        this.msg.warning("执行该操作时请至少选中一条数据");
        return;
      }
    }
    const ro = this.eruptModel.eruptJson.rowOperationMap.get(code);
    if (ro.edits.length <= 0) {
      this.modal.confirm({
        nzTitle: "确定要执行吗",
        nzContent: "",
        nzOnOk: () => {
          this.dataService.execOperatorFun(this.eruptModel.eruptName, code, multi ? this.selectedRows : data, null).subscribe(res => {
            if (res.success) {
              this.st.load(1);
            } else {
              this.msg.error(res.message);
            }
          });
        }
      });
    } else {
      const eruptFieldModels: Array<EruptFieldModel> = [];
      ro.edits.forEach(edit => {
        const eruptFieldModel: EruptFieldModel = {
          fieldName: edit.code,
          fieldReturnName: edit.codeType,
          eruptFieldJson: {
            edit: edit.edit
          }
        };
        eruptFieldModels.push(eruptFieldModel);
      });
      const operatorEruptModel: EruptModel = {
        eruptFieldModels: eruptFieldModels,
        eruptName: this.eruptModel.eruptName,
        eruptJson: this.eruptModel.eruptJson
      };
      this.modal.create({
        nzKeyboard: true,
        nzTitle: ro.title,
        nzCancelText: "取消（ESC）",
        nzOnOk: () => {
          if (validateNotNull(operatorEruptModel, this.msg)) {
            this.dataService.execOperatorFun(this.eruptModel.eruptName, code, multi ? this.selectedRows : data, eruptValueToObject(operatorEruptModel)).subscribe(res => {
              if (res.success) {
                this.st.load(1);
              } else {
                this.msg.error(res.message);
              }
            });
          } else {
            return false;
          }
        },
        nzContent: EditTypeComponent,
        nzComponentParams: {
          eruptModel: operatorEruptModel
        }
      });
    }
  }

  addRow() {
    emptyEruptValue(this.eruptModel);
    this.modal.create({
      nzWrapClassName: "modal-lg",
      nzTitle: "新增",
      nzContent: EditComponent,
      nzComponentParams: {
        eruptModel: this.eruptModel
      },
      nzOnOk: () => {
        if (validateNotNull(this.eruptModel, this.msg)) {
          var v = this.dataService.addEruptData(this.eruptModel.eruptName, eruptValueToObject(this.eruptModel)).subscribe(result => {
            if (result.success) {
              this.st.load(1);
              this.msg.success("新增成功");
              return true;
            } else {
              this.msg.error(result.message);
              return false;
            }
          });
          console.log(v);
        } else {
          return false;
        }
      }
    });
  }

  delRows() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.msg.warning("请选中要删除的数据");
      return;
    }
    const ids = [];
    this.selectedRows.forEach(e => {
      ids.push(e[this.eruptModel.eruptJson.primaryKeyCol]);
    });
    if (ids.length > 0) {
      this.modal.confirm(
        {
          nzTitle: "确定要删除吗？",
          nzContent: "",
          nzOnOk: () => {
            this.dataService.deleteEruptDatas(this.eruptName, ids).subscribe(val => {
              console.log(val);
              this.selectedRows.forEach(r => {
                this.st.removeRow(r);
              });
            });
          }
        }
      );

    } else {
      this.msg.error("请选择要删除的数据项!");
    }
  }

  tableDataChange(data: STData) {
    this.selectedRows = data.checkbox;
  }

  exportExcel() {
    window.open(window["domain"] + "/erupt-api/excel/export/" + this.eruptModel.eruptName);
  }

}

