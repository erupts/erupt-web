import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../../../erupt/service/data.service";
import { EruptModel } from "../../../erupt/model/erupt.model";
import { EruptFieldModel } from "../../../erupt/model/erupt-field.model";
import { DrawerHelper, ModalHelper, SettingsService } from "@delon/theme";
import { EditTypeComponent } from "../../../erupt/edit-type/edit-type.component";
import { EditComponent } from "../edit/edit.component";
import { STComponent, STData } from "@delon/abc";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { EruptAndEruptFieldModel, EruptBuildModel } from "../../../erupt/model/erupt-build.model";
import { deepCopy } from "@delon/util";
import { EditType, RestPath, TabEnum } from "../../../erupt/model/erupt.enum";
import { DataHandlerService } from "../../../erupt/service/data-handler.service";

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

  clientWidth = document.body.clientWidth;

  hideCondition = false;

  searchErupt: EruptModel;

  readonlyErupt: EruptModel;

  eruptBuildModel: EruptBuildModel;

  stConfig = {
    url: null,
    stPage: {
      placement: "center",
      pageSizes: [10, 20, 30, 50, 100],
      showSize: true,
      showQuickJumper: true,
      total: true,
      toTop: true,
      front: false
    },
    req: {
      param: {},
      headers: {},
      method: "POST",
      allInBody: true,
      reName: {
        pi: "_pageIndex",
        ps: "_pageSize"
      }
    },
    multiSort: {
      key: "_sort",
      separator: ",",
      nameSeparator: " "
    }
  };

  selectedRows: any[] = [];

  columns: any[];

  @ViewChild("st") st: STComponent;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.selectedRows = [];
      this.eruptBuildModel = null;
      if (this.searchErupt) {
        this.searchErupt.eruptFieldModels = [];
      }
      //put table api header
      this.stConfig.req.headers["erupt"] = params.name;
      this.dataService.getEruptBuild(params.name).subscribe(em => {
          this.stConfig.url = RestPath.data + "table/" + params.name;
          this.dataHandler.initErupt(em.eruptModel);
          this.eruptBuildModel = em;
          this.buildCombineErupt(em.combineErupts);
          this.buildSubErupt(em.subErupts);
          this.buildTableConfig();
          this.buildSearchErupt();
          this.buildReadOnlyErupt();
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.route.params.subscribe().unsubscribe();
  }

  //构建搜索项信息
  buildSearchErupt() {
    let copyErupt = <EruptModel>deepCopy(this.eruptBuildModel.eruptModel);
    const searchFieldModels = [];
    const searchFieldModelsMap: Map<String, EruptFieldModel> = new Map();
    copyErupt.eruptFieldModels.forEach((field) => {
      searchFieldModelsMap.set(field.fieldName, field);
      if (field.eruptFieldJson.edit.search.value) {
        field.value = null;
        field.eruptFieldJson.edit.notNull = false;
        field.eruptFieldJson.edit.show = true;
        field.eruptFieldJson.edit.$value = null;
        field.eruptFieldJson.edit.$viewValue = null;
        field.eruptFieldJson.edit.$tempValue = null;
        searchFieldModels.push(field);
      }
    });
    copyErupt.mode = "search";
    copyErupt.eruptFieldModels = searchFieldModels;
    copyErupt.eruptFieldModelMap = searchFieldModelsMap;
    this.searchErupt = copyErupt;
  }

  buildSubErupt(subErupts: EruptAndEruptFieldModel[]) {
    subErupts.forEach((sub => {
      this.dataHandler.initErupt(sub.eruptModel);
      const edit = sub.eruptFieldModel.eruptFieldJson.edit;
      if (edit.tabType.type == TabEnum.TREE) {
        if (this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails || this.eruptBuildModel.eruptModel.eruptJson.power.edit) {
          this.dataService.findTabTree(this.eruptBuildModel.eruptModel.eruptName, sub.eruptFieldModel.fieldName).subscribe(
            tree => {
              if (tree) {
                sub.eruptFieldModel.eruptFieldJson.edit.$viewValue = this.dataHandler.dataTreeToZorroTree(tree);
              }
            }
          );
        }
      }
      sub.alainTableConfig = this.dataHandler.viewToAlainTableConfig(sub.eruptModel);
    }));
  }

  buildCombineErupt(combineErupts: EruptAndEruptFieldModel[]) {
    combineErupts.forEach((sub => {
      this.dataHandler.initErupt(sub.eruptModel);
      // sub.alainTableConfig = this.dataHandler.viewToAlainTableConfig(sub.eruptModel);
    }));
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
    const _columns = [];
    _columns.push({
      title: "",
      type: "checkbox",
      fixed: "left",
      className: "text-center",
      index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
    });
    _columns.push({ title: "No", type: "no", fixed: "left", className: "text-center", width: "60px" });
    _columns.push(...this.dataHandler.viewToAlainTableConfig(this.eruptBuildModel.eruptModel));
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
              subErupts: this.eruptBuildModel.subErupts,
              combineErupts: this.eruptBuildModel.combineErupts
            },
            setIdData: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
            behavior: "readonly"
          }
        });
      }
    };

    const edit = {
      icon: "edit",
      click: (record: any) => {
        this.eruptBuildModel.eruptModel.tabLoadCount = 0;
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
            setIdData: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]
          },
          nzOnOk: () => {
            if (this.dataHandler.validateNotNull(this.eruptBuildModel.eruptModel)) {
              if (this.eruptBuildModel.eruptModel.tabLoadCount === this.eruptBuildModel.subErupts.length) {
                this.dataService.editEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
                  this.st.reload();
                  this.msg.success("修改成功");
                  this.modal.closeAll();
                });
              } else {
                this.msg.error("数据还未完全加载完成，请等待完全加载完成后再进行保存操作");
              }
            }
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
    this.eruptBuildModel.eruptModel.eruptJson.rowOperation.forEach(ro => {
      tableOperators.push({
        format: () => {
          return `<i title="${ro.title}" class="fa ${ro.icon}" style="color: #000"></i>`;
        },
        click: (record: any, modal: any) => {
          that.gcOperatorEdits(ro.code, false, record);
        }
      });
    });
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
  gcOperatorEdits(code: string, multi: boolean, data?: object) {
    if (multi) {
      if (!this.selectedRows || this.selectedRows.length == 0) {
        this.msg.warning("执行该操作时请至少选中一条数据");
        return;
      }
    }
    const ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperationMap.get(code);
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
          if (this.dataHandler.validateNotNull(operatorEruptModel)) {
            this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, code, multi ? this.selectedRows : data, this.dataHandler.eruptValueToObject({
              eruptModel: operatorEruptModel
            })).subscribe(res => {
              this.st.reload();
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
        if (this.dataHandler.validateNotNull(this.eruptBuildModel.eruptModel)) {
          this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName, this.dataHandler.eruptValueToObject(this.eruptBuildModel)).subscribe(result => {
            this.st.reload();
            this.modal.closeAll();
            this.msg.success("新增成功");
          });
        }
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

  }

  // excel导入
  importableExcel() {
    this.msg.success("导入");
  }

}

