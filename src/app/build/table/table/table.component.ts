import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { EruptFieldModel } from "../../../erupt/model/erupt-field.model";

import { DrawerHelper, ModalHelper, SettingsService } from "@delon/theme";
import { EditTypeComponent } from "../../../erupt/edit-type/edit-type.component";
import { EditComponent } from "../edit/edit.component";
import { STColumn, STComponent, STData } from "@delon/abc";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { EruptBuildModel } from "../../../erupt/model/erupt-build.model";
import { deepCopy } from "@delon/util";
import { EditType, RestPath } from "../../../erupt/model/erupt.enum";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";
import { ExcelImportComponent } from "../../../erupt/components/excel-import/excel-import.component";
import { Subscription } from "rxjs";
import { BuildConfig } from "../../../erupt/model/build-config";

@Component({
  selector: "erupt-table",
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.less"]
})
export class TableComponent implements OnInit, OnDestroy {

  constructor(private dataService: DataService,
              private settingSrv: SettingsService,
              private modalHelper: ModalHelper,
              private drawerHelper: DrawerHelper,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              @Inject(NzModalService)
              private modal: NzModalService,
              public route: ActivatedRoute,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
              private dataHandler: DataHandlerService
  ) {
  }

  showColCtrl: boolean = false;

  clientWidth = document.body.clientWidth;

  hideCondition = false;

  searchErupt: EruptModel;

  readonlyErupt: EruptModel;

  eruptBuildModel: EruptBuildModel;

  stConfig = new BuildConfig().stConfig;

  selectedRows: any[] = [];

  columns: STColumn[];

  @ViewChild("st") st: STComponent;

  private router$: Subscription;

  ngOnInit() {
    this.router$ = this.route.params.subscribe(params => {
      this.selectedRows = [];
      this.eruptBuildModel = null;
      if (this.searchErupt) {
        this.searchErupt.eruptFieldModels = [];
      }
      //put table api header
      this.stConfig.req.headers["erupt"] = params.name;
      this.dataService.getEruptBuild(params.name).subscribe(eb => {
          this.stConfig.url = RestPath.data + "table/" + params.name;
        this.dataHandler.initErupt(eb);
        this.eruptBuildModel = eb;
        this.buildTabErupt();
          this.buildTableConfig();
        this.searchErupt = this.dataHandler.buildSearchErupt(this.eruptBuildModel);
          this.buildReadOnlyErupt();
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.router$.unsubscribe();
  }

  buildTabErupt() {
    for (let key in this.eruptBuildModel.tabErupts) {
      let eruptFieldModel = this.eruptBuildModel.eruptModel.eruptFieldModelMap.get(key);
      //根据权限来决定是否加载树结构
      if (this.eruptBuildModel.eruptModel.eruptJson.power.edit || this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails) {
        if (eruptFieldModel.eruptFieldJson.edit.type == EditType.TAB_TREE) {
          //构建树结构
          if (this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails || this.eruptBuildModel.eruptModel.eruptJson.power.edit) {
            this.dataService.findTabTree(this.eruptBuildModel.eruptModel.eruptName, eruptFieldModel.fieldName).subscribe(
              tree => {
                if (tree) {
                  eruptFieldModel.eruptFieldJson.edit.$tabTreeViewData = this.dataHandler.dataTreeToZorroTree(tree);
                }
              }
            );
          }
        }
      }
    }
  }

  buildReadOnlyErupt() {
    let copyErupt = <EruptModel>deepCopy(this.eruptBuildModel.eruptModel);
    copyErupt.eruptFieldModels.forEach((field) => {
      field.eruptFieldJson.edit.readOnly = true;
    });
    this.readonlyErupt = copyErupt;
  }

  query() {
    if (this.searchErupt.eruptFieldModels.length > 0) {
      this.stConfig.req.param = {};
      this.stConfig.req.param = this.dataHandler.eruptValueToObject({
        eruptModel: this.searchErupt
      });
    }
    this.st.load(1, this.stConfig.req.param);
  }

  buildTableConfig() {
    const _columns: STColumn[] = [];
    _columns.push({
      title: "",
      width: "50px",
      type: "checkbox",
      fixed: "left",
      className: "text-center",
      index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
    });
    // _columns.push({ title: "#", type: "no", fixed: "left", className: "text-center", width: "60px" });
    let viewCols = this.dataHandler.viewToAlainTableConfig(this.eruptBuildModel.eruptModel);
    for (let viewCol of viewCols) {
      viewCol.show = true;
      viewCol.iif = () => {
        return viewCol.show;
      };
    }
    _columns.push(...viewCols);
    const tableOperators: any = [];
    const eye = {
      icon: "eye",
      click: (record: any, modal: any) => {
        this.modal.create({
          nzWrapClassName: "modal-lg",
          nzStyle: { top: "60px" },
          nzMaskClosable: true,
          nzKeyboard: true,
          nzCancelText: "关闭（ESC）",
          nzOkText: null,
          nzTitle: "查看",
          nzContent: EditComponent,
          nzComponentParams: {
            eruptBuildModel: {
              eruptModel: this.readonlyErupt,
              tabErupts: this.eruptBuildModel.tabErupts,
              combineErupts: this.eruptBuildModel.combineErupts
            },
            setId: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
            behavior: "readonly"
          }
        });
      }
    };

    const edit = {
      icon: "edit",
      click: (record: any) => {
        this.modal.create({
          nzWrapClassName: "modal-lg",
          nzStyle: { top: "60px" },
          nzMaskClosable: false,
          nzKeyboard: false,
          nzTitle: "编辑",
          nzOkText: "修改",
          nzContent: EditComponent,
          nzComponentParams: {
            eruptBuildModel: this.eruptBuildModel,
            setId: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]
          },
          nzOnOk: () => {
            this.dataService.editEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
              this.modal.closeAll();
              this.msg.success("修改成功");
              this.st.reload();
            });
            return false;
          }
        });
      }
    };
    const del = {
      icon: {
        type: "delete",
        theme: "twotone",
        twoToneColor: "#f00"
      },
      type: "del",
      click: (record) => {
        // const msg = this.msg.loading("删除中", {
        //   nzPauseOnHover: true,
        //   nzDuration: 9999
        // });
        // this.msg.remove(msg.messageId);
        this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName, record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]).subscribe(result => {
          this.st.reload();
          this.msg.success("删除成功");
        });
      }
    };

    if (this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails) {
      tableOperators.push(eye);
    }
    if (this.eruptBuildModel.eruptModel.eruptJson.power.edit) {
      tableOperators.push(edit);
    }
    if (this.eruptBuildModel.eruptModel.eruptJson.power.delete) {
      tableOperators.push(del);
    }
    const that = this;
    for (let key in this.eruptBuildModel.eruptModel.eruptJson.rowOperation) {
      let ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperation[key];
      tableOperators.push({
        format: () => {
          return `<i title="${ro.title}" class="fa ${ro.icon}" style="color: #000"></i>`;
        },
        click: (record: any, modal: any) => {
          that.gcOperator(key, false, record);
        }
      });
    }
    _columns.push({
      title: "操作",
      fixed: "right",
      width: tableOperators.length * 25 + 50 + "px",
      className: "text-center",
      buttons: tableOperators
    });
    this.columns = _columns;
  }

  /**
   *  自定义功能触发
   * @param code 编码
   * @param multi 是否为多选执行
   * @param data 数据（单个执行时使用）
   */
  gcOperator(code: string, multi: boolean, data?: object) {
    if (multi) {
      if (!this.selectedRows || this.selectedRows.length == 0) {
        this.msg.warning("执行该操作时请至少选中一条数据");
        return;
      }
    }
    const ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperation[code];
    if (ro.edits.length <= 0) {
      this.modal.confirm({
        nzTitle: "请确认是否执行此操作",
        nzContent: ro.title,
        nzOnOk: () => {
          this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, code, multi ? this.selectedRows : data, null).subscribe(res => {
            this.st.reload();
          });
        }
      });
    } else {
      const eruptFieldModels: EruptFieldModel[] = [];
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
        eruptName: this.eruptBuildModel.eruptModel.eruptName,
        eruptJson: this.eruptBuildModel.eruptModel.eruptJson
      };
      this.modal.create({
        nzKeyboard: true,
        nzTitle: ro.title,
        nzCancelText: "取消（ESC）",
        nzWrapClassName: "modal-lg",
        nzOnOk: () => {
          this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, code, multi ? this.selectedRows : data, this.dataHandler.eruptValueToObject({
            eruptModel: operatorEruptModel
          })).subscribe(res => {
            this.st.reload();
            this.modal.closeAll();
          });
        },
        nzContent: EditTypeComponent,
        nzComponentParams: {
          eruptModel: operatorEruptModel
        }
      });
    }
  }

  //新增
  addRow() {
    this.dataHandler.emptyEruptValue(this.eruptBuildModel);
    this.dataHandler.loadEruptDefaultValue(this.eruptBuildModel.eruptModel);
    this.modal.create({
      nzStyle: { top: "60px" },
      nzWrapClassName: "modal-lg",
      nzMaskClosable: false,
      nzKeyboard: false,
      nzTitle: "新增",
      nzContent: EditComponent,
      nzComponentParams: {
        eruptBuildModel: this.eruptBuildModel
      },
      nzOkText: "增加",
      nzOnOk: () => {
        this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
          this.st.reload();
          this.modal.closeAll();
          this.msg.success("新增成功");
        });
        return false;
      }
    });
  }

  //批量删除
  delRows() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.msg.warning("请选中要删除的数据");
      return;
    }
    const ids = [];
    this.selectedRows.forEach(e => {
      ids.push(e[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]);
    });
    if (ids.length > 0) {
      this.modal.confirm(
        {
          nzTitle: "确定要删除吗？",
          nzContent: "",
          nzOnOk: () => {
            this.dataService.deleteEruptDatas(this.eruptBuildModel.eruptModel.eruptName, ids).subscribe(val => {
              this.st.reload();
              this.msg.success("删除成功");
            });
          }
        }
      );

    } else {
      this.msg.error("请选择要删除的数据项!");
    }
  }

  clearCondition() {
    this.dataHandler.emptyEruptValue({ eruptModel: this.searchErupt });
  }

  // table checkBox 触发事件
  tableDataChange(event: STData) {
    if (event.type === "checkbox") {
      this.selectedRows = event.checkbox;
    }

  }

  downloadExcelTemplate() {
    this.dataService.downloadExcelTemplate(this.eruptBuildModel.eruptModel.eruptName);
  }

  // excel导出
  exportExcel() {
    let condition = null;
    if (this.searchErupt.eruptFieldModels.length > 0) {
      condition = this.dataHandler.eruptValueToObject({
        eruptModel: this.searchErupt
      });
    }
    //导出接口
    this.dataService.downloadExcel(this.eruptBuildModel.eruptModel.eruptName, condition);
  }


  // excel导入
  importableExcel() {
    this.modal.create({
      nzKeyboard: true,
      nzTitle: "Excel导入",
      nzCancelText: "取消（ESC）",
      nzWrapClassName: "modal-lg",
      nzOnOk: () => {
        return false;
      },
      nzContent: ExcelImportComponent,
      nzComponentParams: {
        eruptModel: this.eruptBuildModel.eruptModel
      }
    });
  }

}

