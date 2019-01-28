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
import { STData } from "@delon/abc";
import { ActivatedRoute } from "@angular/router";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { EruptAndEruptFieldModel } from "../../../erupt/model/erupt-page.model";
import { colRules } from "../../../erupt/model/util.model";

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

  hideCondition = false;

  colRules = colRules;

  searchErupt: EruptModel;

  eruptModel: EruptModel;

  subErupts: Array<EruptAndEruptFieldModel>;

  stConfig = {
    stPage: {
      pageSizes: [10, 30, 50, 100],
      showSize: true,
      showQuickJumper: true,
      total: true,
      toTop: true,
      front: false
    },
    req: {
      param: {},
      method: "POST",
      allInBody: true,
      reName: {
        pi: "pageIndex",
        ps: "pageSize"
      }
    },
    multiSort: {
      separator: ",",
      nameSeparator: " "
    }
  };


  selectedRows: Array<any> = [];

  columns: Array<any>;

  @ViewChild("st") st;

  url: string;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.selectedRows = [];
      this.eruptModel = null;
      if (this.searchErupt) {
        this.searchErupt.eruptFieldModels = [];
      }
      this.dataService.getEruptBuild(params.name).subscribe(
        em => {
          this.url = this.dataService.domain + "/erupt-api/data/table/" + params.name;
          this.eruptModel = em.eruptModel;
          this.subErupts = em.subErupts;
          initErupt(this.eruptModel);
          this.buildTableConfig();
          this.buildSearchErupt();
          em.subErupts.forEach((fe => {
            initErupt(fe.eruptModel);
            fe.alainTableConfig = viewToAlainTableConfig(fe.eruptModel.tableColumns);
          }));
        }
      );
    });
  }

  //构建搜索项信息
  buildSearchErupt() {
    const eruptFieldModels = [];
    this.eruptModel.eruptFieldModels.forEach((field) => {
      if (field.eruptFieldJson.edit.search.search) {
        field.eruptFieldJson.edit.notNull = false;
        field.eruptFieldJson.edit.show = true;
        eruptFieldModels.push(field);
      }
    });
    this.searchErupt = {
      mode: "search",
      eruptFieldModels: eruptFieldModels,
      eruptJson: null,
      eruptName: this.eruptModel.eruptName
    };
    console.log(this.searchErupt.eruptFieldModels);
    setTimeout(() => {
    }, 500);

  }

  query() {
    if (this.searchErupt.eruptFieldModels.length > 0) {
      this.stConfig.req.param = {};
      this.searchErupt.eruptFieldModels.forEach(field => {
        const val = field.eruptFieldJson.edit.$value;
        if (val) {
          this.stConfig.req.param[field.fieldName] = val;
        }
      });
    }
    console.log(this.stConfig.req.param);
    this.st.load(1, this.stConfig.req.param);
  }

  buildTableConfig() {
    const _columns = [];
    _columns.push({ title: "", type: "checkbox", fixed: "left", index: this.eruptModel.eruptJson.primaryKeyCol });
    _columns.push({ title: "No", type: "no", fixed: "left", width: "60px" });
    _columns.push(...viewToAlainTableConfig(this.eruptModel.tableColumns));
    const operators = [];
    const that = this;
    this.eruptModel.eruptJson.rowOperation.forEach(ro => {
      if (!ro.multi) {
        operators.push({
          icon: ro.icon,
          click: (record: any, modal: any) => {
            that.gcOperatorEdits(ro.code, false, record);
          }
        });
      }
    });

    if (operators.length > 0) {
      _columns.push({
        title: "功能",
        className: "text-center",
        fixed: "right",
        buttons: [...operators]
      });
    }

    _columns.push({
      fixed: "right",
      title: "操作区",
      className: "text-center",
      buttons: [
        {
          icon: "eye",
          click: (record: any, modal: any) => {

          }
        },
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
            this.dataService.deleteEruptData(this.eruptModel.eruptName, record[this.eruptModel.eruptJson.primaryKeyCol]).subscribe(result => {
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
    const ro = this.eruptModel.eruptJson.rowOperationMap.get(code);
    if (ro.edits.length <= 0) {
      this.modal.confirm({
        nzTitle: "确定要执行吗",
        nzContent: "",
        nzOnOk: () => {
          this.dataService.execOperatorFun(this.eruptModel.eruptName, code, multi ? this.selectedRows : data, null).subscribe(res => {
            if (res.success) {
              this.st.reset();
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
                this.st.reset();
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

  //新增
  addRow() {
    emptyEruptValue(this.eruptModel);
    this.modal.create({
      nzWrapClassName: "modal-lg",
      nzMaskClosable: false,
      nzKeyboard: false,
      nzTitle: "新增",
      nzContent: EditComponent,
      nzComponentParams: {
        eruptModel: this.eruptModel
      },
      nzOnOk: () => {
        if (validateNotNull(this.eruptModel, this.msg)) {
          this.dataService.addEruptData(this.eruptModel.eruptName, eruptValueToObject(this.eruptModel)).subscribe(result => {
            if (result.success) {
              this.st.reset();
              this.msg.success("新增成功");
              return true;
            } else {
              this.msg.error(result.message);
              return false;
            }
          });
        } else {
          return false;
        }
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
      ids.push(e[this.eruptModel.eruptJson.primaryKeyCol]);
    });
    if (ids.length > 0) {
      this.modal.confirm(
        {
          nzTitle: "确定要删除吗？",
          nzContent: "",
          nzOnOk: () => {
            this.dataService.deleteEruptDatas(this.eruptModel.eruptName, ids).subscribe(val => {
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

  // table checkBox 触发事件
  tableDataChange(data: STData) {
    this.selectedRows = data.checkbox;
  }

  // excel导出
  exportExcel() {
    window.open(window["domain"] + "/erupt-api/excel/export/" + this.eruptModel.eruptName);
  }

}

