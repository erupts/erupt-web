import {Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {EruptModel, Row, RowOperation} from "../../model/erupt.model";

import {ALAIN_I18N_TOKEN, DrawerHelper, ModalHelper, SettingsService} from "@delon/theme";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {EditComponent} from "../edit/edit.component";
import {STColumn, STColumnButton, STComponent} from "@delon/abc";
import {ActivatedRoute} from "@angular/router";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {
    OperationMode,
    OperationType,
    OperationIfExprBehavior,
    RestPath,
    Scene,
    SelectMode
} from "../../model/erupt.enum";
import {DataHandlerService} from "../../service/data-handler.service";
import {ExcelImportComponent} from "../../components/excel-import/excel-import.component";
import {BuildConfig} from "../../model/build-config";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {Observable} from "rxjs";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {UiBuildService} from "../../service/ui-build.service";
import {I18NService} from "@core";
import {IframeHeight} from "@shared/util/window.util";
import {HttpClient} from "@angular/common/http";


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
        @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
        private http: HttpClient,
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

    eruptBuildModel: EruptBuildModel;

    stConfig = new BuildConfig().stConfig;

    selectedRows: any[] = [];

    columns: STColumn[];

    showColumnLength: number;

    linkTree: boolean = false;

    showTable: boolean = true;

    downloading: boolean = false;

    _drill: { erupt: string, code: string, eruptParent: string, val: any };


    adding: boolean = false; //新增行为防抖

    pageTopFragmentView: SafeHtml;

    tabsPage: any[];
    iframeHeight = IframeHeight;

    @Output() descEvent = new EventEmitter<string>();

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
        }, (eb: EruptBuildModel) => {
            this.descEvent.emit(eb.eruptModel.eruptJson.desc);
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
                this.renderPageTabs(eb.eruptModel.eruptJson.param);
                let dt = eb.eruptModel.eruptJson.linkTree;
                this.linkTree = !!dt;
                if (dt) {
                    this.showTable = !dt.dependNode;
                }
                this.dataHandler.initErupt(eb);
                this.loadPageTopFragment(eb.eruptModel.eruptJson.param);
                callback && callback(eb);
                this.eruptBuildModel = eb;
                this.buildTableConfig();
                this.searchErupt = this.dataHandler.buildSearchErupt(this.eruptBuildModel);
                this.extraRowFun();
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
        this.stLoad(1, this.stConfig.req.param);
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
                    this.modal.create({
                        nzWrapClassName: "modal-lg edit-modal-lg",
                        nzStyle: {top: "60px"},
                        nzMaskClosable: true,
                        nzKeyboard: true,
                        nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
                        nzOkText: null,
                        nzTitle: this.i18n.fanyi("global.view"),
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
                        nzWrapClassName: "modal-lg edit-modal-lg",
                        nzStyle: {top: "60px"},
                        nzMaskClosable: false,
                        nzKeyboard: false,
                        nzTitle: this.i18n.fanyi("global.editor"),
                        nzOkText: this.i18n.fanyi("global.update"),
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
                                    this.msg.success(this.i18n.fanyi("global.update.success"));
                                    this.stLoad();
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
                pop: this.i18n.fanyi("table.delete.hint"),
                type: "del",
                click: (record) => {
                    this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName,
                        record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol])
                        .subscribe(result => {
                            if (result.status === Status.SUCCESS) {
                                if (this.st._data.length == 1) {
                                    this.stLoad(this.st.pi == 1 ? 1 : this.st.pi - 1);
                                } else {
                                    this.stLoad();
                                }
                                this.msg.success(this.i18n.fanyi('global.delete.success'));
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
                } else {
                    text = ro.title;
                }
                tableOperators.push({
                    type: 'link',
                    text: text,
                    tooltip: ro.title + (ro.tip && "(" + ro.tip + ")"),
                    click: (record: any, modal: any) => {
                        that.createOperator(ro, record);
                    },
                    iifBehavior: ro.ifExprBehavior == OperationIfExprBehavior.DISABLE ? "disabled" : "hide",
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
                title: this.i18n.fanyi("table.operation"),
                fixed: "right",
                width: tableOperators.length * 32 + 18,
                className: "text-center",
                buttons: tableOperators
            });
        }
        this.columns = _columns;
        this.showColumnLength = this.eruptBuildModel.eruptModel.tableColumns.filter(e => e.show).length
    }

    /**
     * 自定义功能触发
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
                this.msg.warning(this.i18n.fanyi("table.require.select_one"));
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
                    nzCancelText: this.i18n.fanyi("global.close"),
                    nzWrapClassName: "modal-lg",
                    nzOnOk: async () => {
                        modal.getInstance().nzCancelDisabled = true;
                        let eruptValue = this.dataHandler.eruptValueToObject({eruptModel: operationErupt});
                        let res = await this.dataService.execOperatorFun(eruptModel.eruptName, ro.code, ids, eruptValue).toPromise().then(res => res);
                        modal.getInstance().nzCancelDisabled = false;
                        this.selectedRows = [];
                        if (res.status === Status.SUCCESS) {
                            this.stLoad();
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
                    nzContent: this.i18n.fanyi("table.hint.operation"),
                    nzCancelText: this.i18n.fanyi("global.close"),
                    nzOnOk: async () => {
                        this.selectedRows = [];
                        let res = await this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids, null)
                            .toPromise().then();
                        this.stLoad();
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
            nzWrapClassName: "modal-lg edit-modal-lg",
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.new"),
            nzContent: EditComponent,
            nzComponentParams: {
                eruptBuildModel: this.eruptBuildModel
            },
            nzOkText: this.i18n.fanyi("global.add"),
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
                            this.msg.success(this.i18n.fanyi("global.add.success"));
                            this.stLoad();
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
                    nzTitle: this.i18n.fanyi("table.hint_delete_number").replace("{}", ids.length),
                    nzContent: "",
                    nzOnOk: async () => {
                        this.deleting = true;
                        let res = await this.dataService.deleteEruptDatas(this.eruptBuildModel.eruptModel.eruptName, ids).toPromise().then(res => res);
                        this.deleting = false;
                        if (res.status == Status.SUCCESS) {
                            if (this.selectedRows.length == this.st._data.length) {
                                this.stLoad(this.st.pi == 1 ? 1 : this.st.pi - 1);
                            } else {
                                this.stLoad();
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
        //如果有选中的行，则下载选中行数据，否则下载远程查询的数据
        if (this.selectedRows && this.selectedRows.length > 0) {
            this.st.export(this.selectedRows);
            return;
        }

        let condition = null;
        if (this.searchErupt.eruptFieldModels.length > 0) {
            condition = this.dataHandler.eruptObjectToCondition(this.dataHandler.eruptValueToObject({
                eruptModel: this.searchErupt
            }));
        }
        // this._drill.val
        //导出接口
        this.downloading = true;
        this.dataService.downloadExcel(this.eruptBuildModel.eruptModel.eruptName, condition, () => {
            this.downloading = false;
        });
    }


    clickTreeNode(event) {
        this.showTable = true;
        this.eruptBuildModel.eruptModel.eruptJson.linkTree.value = event;
        this.searchErupt.eruptJson.linkTree.value = event;
        this.query();
    }

    stLoad(pi?: number, extraParams?: {}) {
        if (pi) {
            this.st.load(pi, extraParams);
        } else {
            this.st.reload();
        }
        this.extraRowFun();
    }

    extraRowFun() {
        if (this.eruptBuildModel.eruptModel.extraRow) {
            this.dataService.extraRow(this.eruptBuildModel.eruptModel.eruptName, this.stConfig.req.param).subscribe(res => {
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
            nzComponentParams: {
                eruptModel: this.eruptBuildModel.eruptModel
            },
            nzOnCancel: () => {
                if (model.getContentComponent().upload) {
                    this.stLoad();
                }
            }
        });
    }

    /**
     * 根据@Erupt的param参数中的_fragmentURL配置，拉取对应的自定义页面头显示在表格顶部
     * @param eruptModelParam
     */
    loadPageTopFragment(eruptModelParam: any) {
        if (eruptModelParam && eruptModelParam._fragmentURL) {
            this.route.params.subscribe((params) => {
                let url = this.dataService.getEruptTpl(eruptModelParam._fragmentURL.value);
                console.log('fragment url:', url);
                this.http.get<string>(url,
                    {
                        headers: {token: this.tokenService.get().token},
                        observe: 'body',
                        reportProgress: false,
                        responseType: 'text' as 'json',
                        withCredentials: true
                    }).subscribe((data: string) => {
                    this.pageTopFragmentView = this.sanitizer.bypassSecurityTrustHtml(data)
                });
            });
        }
    }

    /**
     * 通过获取@Erupt的param参数中的"_tabHeader#xxx"配置来构建一个在表格页面显示的tab组件<br/>
     * 如：
     * <pre>
         @Erupt(name = '测试tab效果', param = [
             @KV(key = '_tabHeader#基础信息', value = '/build/table/Test1'),
             @KV(key = '_tabHeader#活动配置', value = '/tpl/t1'),
             @KV(key = '_tabHeader#用户列表', value = '/tpl/t2')]
         )
     * <pre>
     * 目前问题：每一个tab都通过iframe进行加载，加载时都会显示loading.svg的动画效果，体验起来稍显迟钝，可有优化方案？
     * @param eruptModelParam
     */
    renderPageTabs(eruptModelParam: any) {
        let tabs = [];
        for (let k in eruptModelParam) {
            if (k.startsWith('_tabHeader#')) {
                let url = eruptModelParam[(k)].value || '#';
                url = url.startsWith('/fill/') ? url : '/fill/' + url;
                url = url.replace('//', '/');
                this.route.params.subscribe((params) => {
                    url = window.location.origin + window.location.pathname + '#' + url;
                });

                tabs.push({
                    'tabName': k.split('#')[1],
                    'url': url
                })
            }
        }
        this.tabsPage = tabs || [];
    }

}

