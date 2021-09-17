import {Component, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {EruptModel, RowOperation} from "../../model/erupt.model";

import {DrawerHelper, ModalHelper, SettingsService} from "@delon/theme";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {EditComponent} from "../edit/edit.component";
import {STColumn, STColumnButton, STComponent} from "@delon/abc";
import {ActivatedRoute} from "@angular/router";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {OperationMode, OperationType, RestPath, Scene, SelectMode} from "../../model/erupt.enum";
import {DataHandlerService} from "../../service/data-handler.service";
import {ExcelImportComponent} from "../../components/excel-import/excel-import.component";
import {BuildConfig} from "../../model/build-config";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {Observable} from "rxjs";
import {DomSanitizer} from "@angular/platform-browser";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {UiBuildService} from "../../service/ui-build.service";


@Component({
    selector: "erupt-table",
    templateUrl: "./table.component.html",
    styleUrls: ["./table.component.less"]
})
export class TableComponent implements OnInit {


    constructor(
        public settingSrv: SettingsService,
        private dataService: DataService,
        private modalHelper: ModalHelper,
        private drawerHelper: DrawerHelper,
        @Inject(NzMessageService)
        private msg: NzMessageService,
        @Inject(NzModalService)
        private modal: NzModalService,
        public route: ActivatedRoute,
        private sanitizer: DomSanitizer,
        @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
        private dataHandler: DataHandlerService,
        private uiBuildService: UiBuildService,
    ) {
    }

    @ViewChild("st", {static: false})
    st: STComponent;

    operationMode = OperationMode;

    showColCtrl: boolean = false;

    deleting: boolean = false;

    clientWidth = document.body.clientWidth;

    hideCondition = false;

    searchErupt: EruptModel;

    eruptBuildModel: EruptBuildModel;

    stConfig = new BuildConfig().stConfig;

    selectedRows: any[] = [];

    columns: STColumn[];

    linkTree: boolean = false;

    showTable: boolean = true;

    _drill: { erupt: string, code: string, eruptParent: string, val: any };


    adding: boolean = false; //新增行为防抖

    @Input() set drill(drill: { erupt: string, code: string, eruptParent: string, val: any }) {
        this._drill = drill;
        this.init(this.dataService.getEruptBuild(drill.erupt), {
            url: RestPath.data + "/" + drill.eruptParent + "/drill/" + drill.code + "/" + drill.val,
            header: {
                erupt: drill.eruptParent
            }
        });
    }

    _reference: { eruptBuild: EruptBuildModel, eruptField: EruptFieldModel, mode: SelectMode };

    @Input() set referenceTable(reference: {
        eruptBuild: EruptBuildModel, eruptField: EruptFieldModel, mode:
            SelectMode, parentEruptName?: string, dependVal?: any, tabRef: boolean
    }) {
        this._reference = reference;
        this.init(this.dataService.getEruptBuildByField(reference.eruptBuild.eruptModel.eruptName,
            reference.eruptField.fieldName, reference.parentEruptName), {
            url: RestPath.data + "/" + reference.eruptBuild.eruptModel.eruptName
                + "/reference-table/" + reference.eruptField.fieldName
                + "?tabRef=" + reference.tabRef
                + (reference.dependVal ? "&dependValue=" + reference.dependVal : ''),
            header: {
                erupt: reference.eruptBuild.eruptModel.eruptName,
                eruptParent: reference.parentEruptName || ''
            }
        }, (eb: EruptBuildModel) => {
            let erupt = eb.eruptModel.eruptJson;
            erupt.rowOperation = [];
            erupt.drills = [];
            erupt.power.add = false;
            erupt.power.delete = false;
            erupt.power.importable = false;
            erupt.power.edit = false;
            erupt.power.export = false;
            erupt.power.viewDetails = false;
        });
    }


    @Input() set eruptName(value: string) {
        this.init(this.dataService.getEruptBuild(value), {
            url: RestPath.data + "/table/" + value,
            header: {
                erupt: value
            }
        });
    }

    ngOnInit() {

    }

    init(observable: Observable<EruptBuildModel>, req: {
        url: string,
        header: any
    }, callback?: Function) {
        this.selectedRows = [];
        this.showTable = true;
        this.adding = false;
        this.eruptBuildModel = null;
        if (this.searchErupt) {
            this.searchErupt.eruptFieldModels = [];
        }
        //put table api header
        this.stConfig.req.headers = req.header;
        this.stConfig.url = req.url;
        observable.subscribe(eb => {
                let dt = eb.eruptModel.eruptJson.linkTree;
                this.linkTree = !!dt;
                if (dt) {
                    this.showTable = !dt.dependNode;
                }
                this.dataHandler.initErupt(eb);
                callback && callback(eb);
                this.eruptBuildModel = eb;
                this.buildTableConfig();
                this.searchErupt = this.dataHandler.buildSearchErupt(this.eruptBuildModel);
            }
        );
    }


    query() {
        this.stConfig.req.param["condition"] = this.dataHandler.eruptObjectToCondition(
            this.dataHandler.searchEruptToObject({
                eruptModel: this.searchErupt
            })
        );
        let linkTree = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
        if (linkTree && linkTree.field) {
            this.stConfig.req.param["linkTreeVal"] = linkTree.value;
        }
        this.st.load(1, this.stConfig.req.param);
    }

    buildTableConfig() {
        const _columns: STColumn[] = [];
        if (this._reference) {
            _columns.push({
                title: "", type: this._reference.mode, fixed: "left", width: "50px", className: "text-center",
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
        } else {
            _columns.push({
                title: "",
                width: "50px",
                type: "checkbox",
                fixed: "left",
                className: "text-center left-sticky-checkbox",
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
        }
        let viewCols = this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true);
        for (let viewCol of viewCols) {
            viewCol.iif = () => {
                return viewCol.show;
            };
        }
        _columns.push(...viewCols);
        const tableOperators: STColumnButton[] = [];
        if (this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails) {
            tableOperators.push({
                icon: "eye",
                click: (record: any, modal: any) => {
                    // let eruptBuildModel = deepCopy(this.eruptBuildModel);
                    // eruptBuildModel.eruptModel.eruptFieldModelMap = new Map<String, EruptFieldModel>();
                    // eruptBuildModel.eruptModel.eruptFieldModels.forEach(field => {
                    //     if (field.eruptFieldJson.edit) {
                    //         field.eruptFieldJson.edit.readOnly.add = true;
                    //         field.eruptFieldJson.edit.readOnly.edit = true;
                    //     }
                    //     eruptBuildModel.eruptModel.eruptFieldModelMap.set(field.fieldName, field);
                    // });
                    this.modal.create({
                        nzWrapClassName: "modal-lg",
                        nzStyle: {top: "60px"},
                        nzMaskClosable: true,
                        nzKeyboard: true,
                        nzCancelText: "关闭（ESC）",
                        nzOkText: null,
                        nzTitle: "查看",
                        nzContent: EditComponent,
                        nzComponentParams: {
                            readonly: true,
                            eruptBuildModel: this.eruptBuildModel,
                            id: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                            behavior: Scene.EDIT,
                        }
                    });
                }
            });
        }
        if (this.eruptBuildModel.eruptModel.eruptJson.power.edit) {
            tableOperators.push({
                icon: "edit",
                click: (record: any) => {
                    const model = this.modal.create({
                        nzWrapClassName: "modal-lg",
                        nzStyle: {top: "60px"},
                        nzMaskClosable: false,
                        nzKeyboard: false,
                        nzTitle: "编辑",
                        nzOkText: "修改",
                        nzContent: EditComponent,
                        nzComponentParams: {
                            eruptBuildModel: this.eruptBuildModel,
                            id: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                            behavior: Scene.EDIT,
                        },
                        nzOnOk: async () => {
                            let validateResult = model.getContentComponent().beforeSaveValidate();
                            if (validateResult) {
                                let obj = this.dataHandler.eruptValueToObject(this.eruptBuildModel);
                                let res = await this.dataService.editEruptData(this.eruptBuildModel.eruptModel.eruptName, obj).toPromise().then(res => res);
                                if (res.status === Status.SUCCESS) {
                                    this.msg.success("修改成功");
                                    this.st.reload();
                                    return true;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        }
                    });
                }
            });
        }
        if (this.eruptBuildModel.eruptModel.eruptJson.power.delete) {
            tableOperators.push({
                icon: {
                    type: "delete",
                    theme: "twotone",
                    twoToneColor: "#f00"
                },
                type: "del",
                click: (record) => {
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName,
                        record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol])
                        .subscribe(result => {
                            if (result.status === Status.SUCCESS) {
                                if (this.st._data.length == 1) {
                                    this.st.load(this.st.pi == 1 ? 1 : this.st.pi - 1);
                                } else {
                                    this.st.reload();
                                }
                                this.msg.success("删除成功");
                            }
                        });
                }
            });
        }
        const that = this;
        for (let i in this.eruptBuildModel.eruptModel.eruptJson.rowOperation) {
            let ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperation[i];
            if (ro.mode !== OperationMode.BUTTON) {
                let text = "";
                if (ro.icon) {
                    text = `<i class=\"${ro.icon}\"></i>`;
                }
                tableOperators.push({
                    type: 'link',
                    text: text,
                    tooltip: ro.title + (ro.tip && "(" + ro.tip + ")"),
                    click: (record: any, modal: any) => {
                        that.createOperator(ro, record);
                    },
                    iif: (item) => {
                        if (ro.ifExpr) {
                            return eval(ro.ifExpr);
                        } else {
                            return true;
                        }
                    }
                });
            }
        }

        //drill
        const eruptJson = this.eruptBuildModel.eruptModel.eruptJson;
        for (let i in eruptJson.drills) {
            let drill = eruptJson.drills[i];
            tableOperators.push({
                type: 'link',
                tooltip: drill.title,
                text: `<i class="${drill.icon}"></i>`,
                click: (record) => {
                    let drill = eruptJson.drills[i];
                    this.modal.create({
                        nzWrapClassName: "modal-xxl",
                        nzStyle: {top: "30px"},
                        nzMaskClosable: false,
                        nzKeyboard: false,
                        nzTitle: drill.title,
                        nzFooter: null,
                        nzContent: TableComponent,
                        nzComponentParams: {
                            drill: {
                                code: drill.code,
                                val: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                                erupt: drill.link.linkErupt,
                                eruptParent: this.eruptBuildModel.eruptModel.eruptName
                            }
                        }
                    });
                }
            });
        }
        if (tableOperators.length > 0) {
            _columns.push({
                title: "操作",
                fixed: "right",
                width: tableOperators.length * 40 + 8,
                className: "text-center",
                buttons: tableOperators
            });
        }
        this.columns = _columns;
    }

    /**
     *  自定义功能触发
     * @param rowOperation 行按钮对象
     * @param data 数据（单个执行时使用）
     */
    createOperator(rowOperation: RowOperation, data?: object) {
        const eruptModel = this.eruptBuildModel.eruptModel;
        const ro = rowOperation;
        let ids = [];
        if (data) {
            ids = [data[eruptModel.eruptJson.primaryKeyCol]];
        } else {
            if (ro.mode === OperationMode.MULTI && this.selectedRows.length === 0) {
                this.msg.warning("执行该操作时请至少选中一条数据");
                return;
            }
            this.selectedRows.forEach(e => {
                ids.push(e[eruptModel.eruptJson.primaryKeyCol]);
            });
        }
        if (ro.type === OperationType.TPL) {
            let url = this.dataService.getEruptOperationTpl(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids);
            this.modal.create({
                nzKeyboard: true,
                nzTitle: ro.title,
                nzMaskClosable: false,
                nzStyle: {top: "20px"},
                // nzWrapClassName: "modal-xxl",
                nzWrapClassName: "modal-lg",
                nzBodyStyle: {
                    padding: 0
                },
                nzFooter: null,
                nzContent: EruptIframeComponent,
                nzComponentParams: {
                    url: url
                }
            });
        } else if (ro.type === OperationType.ERUPT) {
            let operationErupt = null;
            if (this.eruptBuildModel.operationErupts) {
                operationErupt = this.eruptBuildModel.operationErupts[ro.code];
            }
            if (operationErupt) {
                this.dataHandler.initErupt({eruptModel: operationErupt});
                this.dataHandler.emptyEruptValue({
                    eruptModel: operationErupt
                });
                let modal = this.modal.create({
                    nzKeyboard: false,
                    nzTitle: ro.title,
                    nzMaskClosable: false,
                    nzCancelText: "关闭",
                    nzWrapClassName: "modal-lg",
                    nzOnOk: async () => {
                        modal.getInstance().nzCancelDisabled = true;
                        let eruptValue = this.dataHandler.eruptValueToObject({eruptModel: operationErupt});
                        let res = await this.dataService.execOperatorFun(eruptModel.eruptName, ro.code, ids, eruptValue).toPromise().then(res => res);
                        modal.getInstance().nzCancelDisabled = false;
                        this.selectedRows = [];
                        if (res.status === Status.SUCCESS) {
                            this.st.reload();
                            res.data && eval(res.data);
                            return true;
                        } else {
                            return false;
                        }
                    },
                    nzContent: EditTypeComponent,
                    nzComponentParams: {
                        mode: Scene.ADD,
                        eruptBuildModel: {
                            eruptModel: operationErupt
                        },
                        parentEruptName: this.eruptBuildModel.eruptModel.eruptName
                    }
                });
            } else {
                this.modal.confirm({
                    nzTitle: ro.title,
                    nzContent: "请确认是否执行此操作",
                    nzCancelText: "关闭",
                    nzOnOk: async () => {
                        this.selectedRows = [];
                        let res = await this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids, null)
                            .toPromise().then();
                        this.st.reload();
                        if (res.data) {
                            eval(res.data);
                        }
                    }
                });
            }
        }
    }

    //新增
    addRow() {
        const modal = this.modal.create({
            nzStyle: {top: "60px"},
            nzWrapClassName: "modal-lg",
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: "新增",
            nzContent: EditComponent,
            nzComponentParams: {
                eruptBuildModel: this.eruptBuildModel
            },
            nzOkText: "增加",
            nzOnOk: async () => {
                if (!this.adding) {
                    this.adding = true;
                    setTimeout(() => {
                        this.adding = false;
                    }, 500);
                    if (modal.getContentComponent().beforeSaveValidate()) {
                        let res: EruptApiModel;
                        if (this._drill && this._drill.val) {
                            res = await this.dataService.addEruptDrillData(
                                this._drill.eruptParent,
                                this._drill.code,
                                this._drill.val,
                                this.dataHandler.eruptValueToObject(this.eruptBuildModel)).toPromise().then(res => res);
                        } else {
                            let header = {};
                            if (this.linkTree) {
                                let lt = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
                                if (lt.dependNode && lt.value) {
                                    header["link"] = this.eruptBuildModel.eruptModel.eruptJson.linkTree.value;
                                }
                            }
                            res = await this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
                                this.dataHandler.eruptValueToObject(this.eruptBuildModel), header).toPromise().then(res => res);
                        }
                        if (res.status === Status.SUCCESS) {
                            this.msg.success("新增成功");
                            this.st.reload();
                            return true;
                        }
                    }
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
                    nzTitle: "确定要删除这" + ids.length + "条数据吗？",
                    nzContent: "",
                    nzOnOk: async () => {
                        this.deleting = true;
                        let res = await this.dataService.deleteEruptDatas(this.eruptBuildModel.eruptModel.eruptName, ids).toPromise().then(res => res);
                        this.deleting = false;
                        if (res.status == Status.SUCCESS) {
                            if (this.selectedRows.length == this.st._data.length) {
                                this.st.load(this.st.pi == 1 ? 1 : this.st.pi - 1);
                            } else {
                                this.st.reload();
                            }
                            this.selectedRows = [];
                            this.msg.success("删除成功");
                        }
                    }
                }
            );

        } else {
            this.msg.error("请选择要删除的数据项!");
        }
    }

    clearCondition() {
        this.dataHandler.emptyEruptValue({eruptModel: this.searchErupt});
    }

    // table checkBox 触发事件
    tableDataChange(event: any) {
        if (this._reference) {
            if (this._reference.mode == SelectMode.radio) {
                if (event.type === "click") {
                    for (let datum of this.st._data) {
                        datum.checked = false;
                    }
                    event.click.item.checked = true;
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.click.item;
                } else if (event.type === "radio") {
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.radio;
                }
            } else if (this._reference.mode == SelectMode.checkbox) {
                if (event.type === "checkbox") {
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.checkbox;
                }
            }
        } else {
            if (event.type === "checkbox") {
                this.selectedRows = event.checkbox;
            }
        }
    }

    downloadExcelTemplate() {
        this.dataService.downloadExcelTemplate(this.eruptBuildModel.eruptModel.eruptName);
    }

    // excel导出
    exportExcel() {
        let condition = null;
        if (this.searchErupt.eruptFieldModels.length > 0) {
            condition = this.dataHandler.eruptObjectToCondition(this.dataHandler.eruptValueToObject({
                eruptModel: this.searchErupt
            }));
        }
        //导出接口
        this.dataService.downloadExcel(this.eruptBuildModel.eruptModel.eruptName, condition);
    }


    clickTreeNode(event) {
        this.showTable = true;
        this.eruptBuildModel.eruptModel.eruptJson.linkTree.value = event;
        this.searchErupt.eruptJson.linkTree.value = event;
        this.query();
    }


    // excel导入
    importableExcel() {
        let model = this.modal.create({
            nzKeyboard: true,
            nzTitle: "Excel导入",
            nzOkText: null,
            nzCancelText: "关闭（ESC）",
            nzWrapClassName: "modal-lg",
            nzContent: ExcelImportComponent,
            nzComponentParams: {
                eruptModel: this.eruptBuildModel.eruptModel
            },
            nzOnCancel: () => {
                if (model.getContentComponent().upload) {
                    this.st.reload();
                }
            }
        });
    }

}

