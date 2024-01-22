import {Component, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {Drill, DrillInput, EruptModel, Row, RowOperation} from "../../model/erupt.model";

import {SettingsService} from "@delon/theme";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {EditComponent} from "../edit/edit.component";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {
    FormSize,
    OperationIfExprBehavior,
    OperationMode,
    OperationType,
    PagingType,
    RestPath,
    Scene,
    SelectMode
} from "../../model/erupt.enum";
import {DataHandlerService} from "../../service/data-handler.service";
import {ExcelImportComponent} from "../../components/excel-import/excel-import.component";
import {Status} from "../../model/erupt-api.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {Observable} from "rxjs";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {UiBuildService} from "../../service/ui-build.service";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {STColumn, STColumnButton, STComponent} from "@delon/abc/st";
import {NzModalRef} from "ng-zorro-antd/modal/modal-ref";
import {deepCopy} from "@delon/util";
import {ModalButtonOptions} from "ng-zorro-antd/modal/modal-types";
import {STChange, STPage} from "@delon/abc/st/st.interfaces";
import {AppViewService} from "@shared/service/app-view.service";


@Component({
    selector: "erupt-table",
    templateUrl: "./table.component.html",
    styleUrls: ["./table.component.less"]
})
export class TableComponent implements OnInit {


    constructor(
        public settingSrv: SettingsService,
        public dataService: DataService,
        private dataHandlerService: DataHandlerService,
        @Inject(NzMessageService)
        private msg: NzMessageService,
        @Inject(NzModalService)
        private modal: NzModalService,
        private appViewService: AppViewService,
        private dataHandler: DataHandlerService,
        private uiBuildService: UiBuildService,
        private i18n: I18NService
    ) {
    }

    @ViewChild("st", {static: false})
    st: STComponent;

    extraRows: Row[];

    operationMode = OperationMode;

    showColCtrl: boolean = false;

    deleting: boolean = false;

    clientWidth = document.body.clientWidth;

    hideCondition = false;

    searchErupt: EruptModel;

    hasSearchFields: boolean = false;

    eruptBuildModel: EruptBuildModel;

    selectedRows: any[] = [];

    columns: STColumn[];

    showColumnLength: number;

    linkTree: boolean = false;

    showTable: boolean = true;

    downloading: boolean = false;

    //操作按钮数量
    operationButtonNum = 0;

    _drill: DrillInput;

    dataPage: {
        querying: boolean,
        showPagination: boolean
        pageSizes: number[],
        ps: number;
        pi: number;
        sort: object | null;
        total: number;
        data: any[];
        multiSort?: string[]
        page: STPage;
        url: string
    } = {
        querying: false,
        showPagination: true,
        pageSizes: [10, 20, 50, 100, 300, 500],
        ps: 10,
        pi: 1,
        total: 0,
        data: [],
        sort: null,
        multiSort: [],
        page: {
            show: false,
            toTop: false
        },
        url: null
    };

    adding: boolean = false; //新增行为防抖

    header: object;

    @Input() set drill(drill: DrillInput) {
        this._drill = drill;
        this.init(this.dataService.getEruptBuild(drill.erupt), {
            url: RestPath.data + "/table/" + drill.erupt,
            header: {
                erupt: drill.erupt,
                ...DataService.drillToHeader(drill)
            }
        });
    }

    _reference: { eruptBuild: EruptBuildModel, eruptField: EruptFieldModel, mode: SelectMode };

    @Input() set referenceTable(reference: {
        eruptBuild: EruptBuildModel,
        eruptField: EruptFieldModel, mode: SelectMode,
        parentEruptName?: string,
        dependVal?: any, tabRef: boolean
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
        }, (eb: EruptBuildModel) => {
            this.appViewService.setRouterViewDesc(eb.eruptModel.eruptJson.desc);
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
        this.searchErupt = null;
        this.hasSearchFields = false;
        this.operationButtonNum = 0;
        this.header = req.header;
        this.dataPage.url = req.url;
        observable.subscribe(eb => {
                eb.eruptModel.eruptJson.rowOperation.forEach((item) => {
                    if (item.mode != OperationMode.SINGLE) {
                        this.operationButtonNum++;
                    }
                })
                let layout = eb.eruptModel.eruptJson.layout;
                if (layout) {
                    if (layout.pageSizes) {
                        this.dataPage.pageSizes = layout.pageSizes;
                    }
                    if (layout.pageSize) {
                        this.dataPage.ps = layout.pageSize;
                    }
                    if (layout.pagingType) {
                        if (layout.pagingType == PagingType.FRONT) {
                            let page = this.dataPage.page;
                            page.front = true;
                            page.show = true;
                            page.placement = "center";
                            page.showQuickJumper = true;
                            page.showSize = true;
                            page.pageSizes = layout.pageSizes;
                            this.dataPage.showPagination = false;
                        } else if (layout.pagingType == PagingType.NONE) {
                            this.dataPage.ps = layout.pageSizes[layout.pageSizes.length - 1] * 10;
                            this.dataPage.showPagination = false;
                            this.dataPage.page.show = false;
                        }
                    }
                }
                let dt = eb.eruptModel.eruptJson.linkTree;
                this.linkTree = !!dt;
                this.dataHandler.initErupt(eb);
                callback && callback(eb);
                this.eruptBuildModel = eb;
                this.buildTableConfig();
                this.searchErupt = <EruptModel>deepCopy(this.eruptBuildModel.eruptModel);
                for (let fieldModel of this.searchErupt.eruptFieldModels) {
                    let edit = fieldModel.eruptFieldJson.edit;
                    if (edit) {
                        if (edit.search.value) {
                            this.hasSearchFields = true;
                            fieldModel.eruptFieldJson.edit.$value = this.searchErupt.searchCondition[fieldModel.fieldName]
                        }
                    }
                }
                if (dt) {
                    this.showTable = !dt.dependNode;
                    if (dt.dependNode) {
                        return;
                    }
                }
                this.query(1);
            }
        );
    }

    query(page?: number, size?: number, sort?: object) {
        if (!this.eruptBuildModel.power.query) {
            return;
        }
        let query = {};
        query["condition"] = this.dataHandler.eruptObjectToCondition(
            this.dataHandler.searchEruptToObject({
                eruptModel: this.searchErupt
            })
        );
        let linkTree = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
        if (linkTree && linkTree.field) {
            query["linkTreeVal"] = linkTree.value;
        }
        this.dataPage.pi = page || this.dataPage.pi;
        this.dataPage.ps = size || this.dataPage.ps;
        this.dataPage.sort = sort || this.dataPage.sort;
        let sortString = null;
        if (this.dataPage.sort) {
            let arr = [];
            for (let key in this.dataPage.sort) {
                arr.push(key + ' ' + this.dataPage.sort[key]);
            }
            sortString = arr.join(",")
        }
        this.dataPage.querying = true;
        this.dataService.queryEruptTableData(this.eruptBuildModel.eruptModel.eruptName, this.dataPage.url, {
            pageIndex: this.dataPage.pi,
            pageSize: this.dataPage.ps,
            sort: sortString,
            ...query
        }, this.header).subscribe(page => {
            this.dataPage.querying = false;
            this.dataPage.data = page.list
            this.dataPage.total = page.total;
            // for (let ele of spliceArr(page.list, 20)) {
            //     this.dataPage.data.push(...ele)
            // }
        })
        this.extraRowFun(query);
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
                width: "40px",
                resizable: false,
                type: "checkbox",
                fixed: "left",
                className: "text-center left-sticky-checkbox",
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
        }
        let viewCols = this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true);
        for (let viewCol of viewCols) {
            viewCol.iif = () => {
                return viewCol['show'];
            };
        }
        _columns.push(...viewCols);
        const tableOperators: STColumnButton[] = [];
        if (this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails) {
            let fullLine = false;
            let layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
            if (layout && layout.formSize == FormSize.FULL_LINE) {
                fullLine = true;
            }
            tableOperators.push({
                icon: "eye",
                click: (record: any, modal: any) => {
                    let ref = this.modal.create({
                        nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
                        nzWidth: fullLine ? 550 : null,
                        nzStyle: {top: "60px"},
                        nzMaskClosable: true,
                        nzKeyboard: true,
                        nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
                        nzOkText: null,
                        nzTitle: this.i18n.fanyi("global.view"),
                        nzContent: EditComponent
                    });
                    ref.getContentComponent().readonly = true;
                    ref.getContentComponent().eruptBuildModel = this.eruptBuildModel;
                    ref.getContentComponent().behavior = Scene.EDIT;
                    ref.getContentComponent().id = record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
                }
            });
        }
        let tableButtons: STColumnButton[] = []
        let editButtons: ModalButtonOptions[] = [];
        const that = this;
        let exprEval = (expr, item) => {
            try {
                if (expr) {
                    return eval(expr);
                } else {
                    return true;
                }
            } catch (e) {
                // this.msg.error(e);
                return false;
            }
        }
        for (let i in this.eruptBuildModel.eruptModel.eruptJson.rowOperation) {
            let ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperation[i];
            if (ro.mode !== OperationMode.BUTTON) {
                let text = "";
                if (ro.icon) {
                    text = `<i class=\"${ro.icon}\"></i>`;
                } else {
                    text = ro.title;
                }

                tableButtons.push({
                    type: 'link',
                    text: text,
                    tooltip: ro.title + (ro.tip && "(" + ro.tip + ")"),
                    click: (record: any, modal: any) => {
                        that.createOperator(ro, record);
                    },
                    iifBehavior: ro.ifExprBehavior == OperationIfExprBehavior.DISABLE ? "disabled" : "hide",
                    iif: (item) => {
                        return exprEval(ro.ifExpr, item);
                    }
                });
                // editButtons.push({
                //     label: ro.title,
                //     type: 'dashed',
                //     show: (options: ModalButtonOptions<any>) => {
                //         return !ro.ifExpr;
                //     },
                //     onClick(options: ModalButtonOptions<any>) {
                //         that.createOperator(ro, options);
                //     }
                // })
            }
        }

        //drill
        const eruptJson = this.eruptBuildModel.eruptModel.eruptJson;

        let createDrillModel = (drill: Drill, id: any) => {
            let ref = this.modal.create({
                nzWrapClassName: "modal-xxl",
                nzStyle: {top: "30px"},
                nzBodyStyle: {padding: "18px"},
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: drill.title,
                nzFooter: null,
                nzContent: TableComponent
            });
            ref.getContentComponent().drill = {
                code: drill.code,
                val: id,
                erupt: drill.link.linkErupt,
                eruptParent: this.eruptBuildModel.eruptModel.eruptName
            }
        }

        for (let i in eruptJson.drills) {
            let drill = eruptJson.drills[i];
            tableButtons.push({
                type: 'link',
                tooltip: drill.title,
                text: `<i class="${drill.icon}"></i>`,
                click: (record) => {
                    createDrillModel(drill, record[eruptJson.primaryKeyCol]);
                }
            });
            editButtons.push({
                label: drill.title,
                type: 'dashed',
                onClick(options: ModalButtonOptions<any>) {
                    createDrillModel(drill, options[eruptJson.primaryKeyCol]);
                }
            })
        }

        let getEditButtons = (record): ModalButtonOptions[] => {
            for (let editButton of editButtons) {
                editButton['id'] = record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]
                editButton['data'] = record
            }
            return editButtons;
        }

        if (this.eruptBuildModel.eruptModel.eruptJson.power.edit) {
            let fullLine = false;
            let layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
            if (layout && layout.formSize == FormSize.FULL_LINE) {
                fullLine = true;
            }
            tableOperators.push({
                icon: "edit",
                click: (record: any) => {
                    const model = this.modal.create({
                        nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
                        nzWidth: fullLine ? 550 : null,
                        nzStyle: {top: "60px"},
                        nzMaskClosable: false,
                        nzKeyboard: false,
                        nzTitle: this.i18n.fanyi("global.editor"),
                        nzOkText: this.i18n.fanyi("global.update"),
                        nzContent: EditComponent,
                        nzFooter: [
                            {
                                label: this.i18n.fanyi("global.cancel"),
                                onClick: () => {
                                    model.close();
                                }
                            },
                            ...getEditButtons(record),
                            {
                                label: this.i18n.fanyi("global.update"),
                                type: "primary",
                                onClick: () => {
                                    return model.triggerOk();
                                }
                            },
                        ],
                        nzOnOk: async () => {
                            let validateResult = model.getContentComponent().beforeSaveValidate();
                            if (validateResult) {
                                let obj = this.dataHandler.eruptValueToObject(this.eruptBuildModel);
                                let res = await this.dataService.updateEruptData(this.eruptBuildModel.eruptModel.eruptName, obj).toPromise().then(res => res);
                                if (res.status === Status.SUCCESS) {
                                    this.msg.success(this.i18n.fanyi("global.update.success"));
                                    this.query();
                                    return true;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        }
                    });
                    model.getContentComponent().eruptBuildModel = this.eruptBuildModel;
                    model.getContentComponent().id = record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
                    model.getContentComponent().behavior = Scene.EDIT;
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
                pop: this.i18n.fanyi("table.delete.hint"),
                type: "del",
                click: (record) => {
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName,
                        record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol])
                        .subscribe(result => {
                            if (result.status === Status.SUCCESS) {
                                if (this.st._data.length == 1) {
                                    this.query(this.st.pi == 1 ? 1 : this.st.pi - 1);
                                } else {
                                    this.query(this.st.pi);
                                }
                                this.msg.success(this.i18n.fanyi('global.delete.success'));
                            }
                        });
                }
            });
        }
        tableOperators.push(...tableButtons);
        if (tableOperators.length > 0) {
            _columns.push({
                title: this.i18n.fanyi("table.operation"),
                fixed: "right",
                width: tableOperators.length * 35 + 18,
                className: "text-center",
                buttons: tableOperators,
                resizable: false
            });
        }
        this.columns = _columns;
        this.showColumnLength = this.eruptBuildModel.eruptModel.tableColumns.filter(e => e.show).length;
    }


    /**
     * 自定义功能触发
     * @param rowOperation 行按钮对象
     * @param data 数据（单个执行时使用）
     */
    createOperator(rowOperation: RowOperation, data?: object, reloadModal?: boolean) {
        const eruptModel = this.eruptBuildModel.eruptModel;
        const ro = rowOperation;
        let ids = [];
        if (data) {
            ids = [data[eruptModel.eruptJson.primaryKeyCol]];
        } else {
            if (ro.mode === OperationMode.MULTI && this.selectedRows.length === 0) {
                this.msg.warning(this.i18n.fanyi("table.require.select_one"));
                return;
            }
            this.selectedRows.forEach(e => {
                ids.push(e[eruptModel.eruptJson.primaryKeyCol]);
            });
        }
        if (ro.type === OperationType.TPL) {
            let url = this.dataService.getEruptOperationTpl(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids);
            let ref = this.modal.create({
                nzKeyboard: true,
                nzTitle: ro.title,
                nzMaskClosable: false,
                nzWidth: ro.tpl.width,
                nzStyle: {top: "20px"},
                // nzWrapClassName: "modal-xxl",
                nzWrapClassName: ro.tpl.width || "modal-lg",
                nzBodyStyle: {
                    padding: "0"
                },
                nzFooter: null,
                nzContent: EruptIframeComponent,
                nzOnCancel: () => {
                    // this.query();
                }
            });
            ref.getContentComponent().url = url;
        } else if (ro.type === OperationType.ERUPT) {
            let operationErupt: EruptModel = null;
            if (this.eruptBuildModel.operationErupts) {
                operationErupt = this.eruptBuildModel.operationErupts[ro.code];
            }
            if (operationErupt) {
                this.dataHandler.initErupt({eruptModel: operationErupt});
                this.dataHandler.emptyEruptValue({
                    eruptModel: operationErupt
                });
                let modal: NzModalRef = this.modal.create({
                    nzKeyboard: false,
                    nzTitle: ro.title,
                    nzMaskClosable: false,
                    nzCancelText: this.i18n.fanyi("global.close"),
                    nzWrapClassName: "modal-lg",
                    nzOnOk: async () => {
                        modal.componentInstance.nzCancelDisabled = true;
                        let eruptValue = this.dataHandler.eruptValueToObject({eruptModel: operationErupt});
                        let res = await this.dataService.execOperatorFun(eruptModel.eruptName, ro.code, ids, eruptValue).toPromise().then(res => res);
                        modal.componentInstance.nzCancelDisabled = false;
                        this.selectedRows = [];
                        if (res.status === Status.SUCCESS) {
                            this.query();
                            if (res.data) {
                                try {
                                    let msg = this.msg;
                                    eval(res.data);
                                } catch (e) {
                                    this.msg.error(e);
                                }
                            }
                            return true;
                        } else {
                            return false;
                        }
                    },
                    nzContent: EditTypeComponent
                });
                modal.getContentComponent().mode = Scene.ADD;
                modal.getContentComponent().eruptBuildModel = {eruptModel: operationErupt};
                modal.getContentComponent().parentEruptName = this.eruptBuildModel.eruptModel.eruptName;
                this.dataService.getInitValue(operationErupt.eruptName, this.eruptBuildModel.eruptModel.eruptName, this._drill ? DataService.drillToHeader(this._drill) : {}).subscribe(data => {
                    this.dataHandlerService.objectToEruptValue(data, {
                        eruptModel: operationErupt
                    });
                });
            } else {
                this.modal.confirm({
                    nzTitle: ro.title,
                    nzContent: this.i18n.fanyi("table.hint.operation"),
                    nzCancelText: this.i18n.fanyi("global.close"),
                    nzOnOk: async () => {
                        this.selectedRows = [];
                        let res = await this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids, null)
                            .toPromise().then();
                        this.query();
                        if (res.data) {
                            try {
                                let msg = this.msg;
                                eval(res.data);
                            } catch (e) {
                                this.msg.error(e);
                            }
                        }
                    }
                });
            }
        }
    }

    //新增
    addData() {
        let fullLine = false;
        let layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
        if (layout && layout.formSize == FormSize.FULL_LINE) {
            fullLine = true;
        }
        const modal = this.modal.create({
            nzStyle: {top: "60px"},
            nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
            nzWidth: fullLine ? 550 : null,
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.new"),
            nzContent: EditComponent,
            nzOkText: this.i18n.fanyi("global.add"),
            nzOnOk: async () => {
                if (!this.adding) {
                    this.adding = true;
                    setTimeout(() => {
                        this.adding = false;
                    }, 500);
                    if (modal.getContentComponent().beforeSaveValidate()) {
                        let header = {};
                        if (this.linkTree) {
                            let lt = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
                            if (lt.dependNode && lt.value) {
                                header["link"] = this.eruptBuildModel.eruptModel.eruptJson.linkTree.value;
                            }
                        }
                        if (this._drill) {
                            Object.assign(header, DataService.drillToHeader(this._drill));
                        }
                        let res = await this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
                            this.dataHandler.eruptValueToObject(this.eruptBuildModel), header).toPromise().then(res => res);
                        if (res.status === Status.SUCCESS) {
                            this.msg.success(this.i18n.fanyi("global.add.success"));
                            this.query();
                            return true;
                        }
                    }
                }
                return false;
            }
        });
        modal.getContentComponent().eruptBuildModel = this.eruptBuildModel
        modal.getContentComponent().header = this._drill ? DataService.drillToHeader(this._drill) : {};
    }

    pageIndexChange(index) {
        this.query(index, this.dataPage.ps);
    }

    pageSizeChange(size) {
        this.query(1, size);
    }

    //批量删除
    delRows() {
        if (!this.selectedRows || this.selectedRows.length === 0) {
            this.msg.warning(this.i18n.fanyi("table.select_delete_item"));
            return;
        }
        const ids = [];
        this.selectedRows.forEach(e => {
            ids.push(e[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]);
        });
        if (ids.length > 0) {
            this.modal.confirm(
                {
                    nzTitle: this.i18n.fanyi("table.hint_delete_number").replace("{}", ids.length + ""),
                    nzContent: "",
                    nzOnOk: async () => {
                        this.deleting = true;
                        let res = await this.dataService.deleteEruptDataList(this.eruptBuildModel.eruptModel.eruptName, ids).toPromise().then(res => res);
                        this.deleting = false;
                        if (res.status == Status.SUCCESS) {
                            if (this.selectedRows.length == this.st._data.length) {
                                this.query(this.st.pi == 1 ? 1 : this.st.pi - 1);
                            } else {
                                this.query(this.st.pi);
                            }
                            this.selectedRows = [];
                            this.msg.success(this.i18n.fanyi("global.delete.success"));
                        }
                    }
                }
            );
        } else {
            this.msg.error(this.i18n.fanyi("table.select_delete_item"));
        }
    }

    clearCondition() {
        this.dataHandler.emptyEruptValue({eruptModel: this.searchErupt});
        this.query(1);
    }

    // table checkBox 触发事件
    tableDataChange(event: STChange) {
        if (this._reference) {
            if (this._reference.mode == SelectMode.radio) {
                if (event.type === "click") {
                    this.st.clearRadio();
                    this.st.setRow(event.click.index, {checked: true})
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.click.item;
                } else if (event.type === "radio") {
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.radio;
                }
            } else if (this._reference.mode == SelectMode.checkbox) {
                // this.st.setRow(event.click.index, {checked: !event.click.item.checked})
                if (event.type === "checkbox") {
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.checkbox;
                }
            }
        } else {
            if (event.type === "checkbox") {
                this.selectedRows = event.checkbox;
            }
        }
        if (event.type == "sort") {
            let layout = this.eruptBuildModel.eruptModel.eruptJson.layout
            if (layout && layout.pagingType && layout.pagingType != 'BACKEND') {
                return;
            }
            this.query(1, this.dataPage.ps, event.sort.map);
        }
    }

    downloadExcelTemplate() {
        this.dataService.downloadExcelTemplate(this.eruptBuildModel.eruptModel.eruptName);
    }

    // excel导出
    exportExcel() {
        let condition = null;
        if (this.searchErupt && this.searchErupt.eruptFieldModels.length > 0) {
            condition = this.dataHandler.eruptObjectToCondition(this.dataHandler.eruptValueToObject({
                eruptModel: this.searchErupt
            }));
        }
        //导出接口
        this.downloading = true;
        this.dataService.downloadExcel(this.eruptBuildModel.eruptModel.eruptName, condition,
            this._drill ? DataService.drillToHeader(this._drill) : {},
            () => {
                this.downloading = false;
            }
        );
    }


    clickTreeNode(event) {
        this.showTable = true;
        this.eruptBuildModel.eruptModel.eruptJson.linkTree.value = event;
        this.searchErupt.eruptJson.linkTree.value = event;
        this.query(1);
    }

    extraRowFun(condition: any) {
        if (this.eruptBuildModel.eruptModel.extraRow) {
            this.dataService.extraRow(this.eruptBuildModel.eruptModel.eruptName, condition).subscribe(res => {
                this.extraRows = res;
            });
        }
    }

    // excel导入
    importableExcel() {
        let model = this.modal.create({
            nzKeyboard: true,
            nzTitle: "Excel " + this.i18n.fanyi("table.import"),
            nzOkText: null,
            nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
            nzWrapClassName: "modal-lg",
            nzContent: ExcelImportComponent,
            nzOnCancel: () => {
                if (model.getContentComponent().upload) {
                    this.query();
                }
            }
        });
        model.getContentComponent().eruptModel = this.eruptBuildModel.eruptModel;
        model.getContentComponent().drillInput = this._drill;
    }

}

