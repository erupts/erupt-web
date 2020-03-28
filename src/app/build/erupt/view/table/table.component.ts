import {Component, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";

import {DrawerHelper, ModalHelper, SettingsService} from "@delon/theme";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {EditComponent} from "../edit/edit.component";
import {STColumn, STColumnButton, STComponent} from "@delon/abc";
import {ActivatedRoute} from "@angular/router";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {deepCopy} from "@delon/util";
import {EditType, RestPath, SelectMode} from "../../model/erupt.enum";
import {DataHandlerService} from "../../service/data-handler.service";
import {ExcelImportComponent} from "../../components/excel-import/excel-import.component";
import {BuildConfig} from "../../model/build-config";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {Observable} from "rxjs";

@Component({
    selector: "table-erupt",
    templateUrl: "./table.component.html",
    styleUrls: ["./table.component.less"]
})
export class TableComponent implements OnInit {

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

    @ViewChild("st", {static: false})
    st: STComponent;

    ww = window.document.documentElement.clientHeight;

    showColCtrl: boolean = false;

    clientWidth = document.body.clientWidth;

    hideCondition = false;

    searchErupt: EruptModel;

    eruptBuildModel: EruptBuildModel;

    stConfig = new BuildConfig().stConfig;

    selectedRows: any[] = [];

    columns: STColumn[];

    layoutTree: boolean;

    _drill: { erupt: string, code: string, eruptParent: string, val: any };

    @Input() set drill(drill: { erupt: string, code: string, eruptParent: string, val: any }) {
        this._drill = drill;
        this.init(this.dataService.getEruptBuild(drill.erupt), {
            url: RestPath.data + drill.eruptParent + "/drill/" + drill.code + "/" + drill.val,
            header: {
                erupt: drill.eruptParent
            }
        });
    }

    _reference: { eruptBuild: EruptBuildModel, eruptField: EruptFieldModel, mode: SelectMode };

    @Input() set referenceTable(reference: { eruptBuild: EruptBuildModel, eruptField: EruptFieldModel, mode: SelectMode, dependVal?: any }) {
        this._reference = reference;
        this.init(this.dataService.getEruptBuildByField(reference.eruptBuild.eruptModel.eruptName,
            reference.eruptField.fieldName), {
            url: RestPath.data + reference.eruptBuild.eruptModel.eruptName
                + "/reference-table/"
                + reference.eruptField.fieldName + (reference.dependVal && "?dependValue=" + reference.dependVal),
            header: {
                erupt: reference.eruptBuild.eruptModel.eruptName
            }
        }, (eb: EruptBuildModel) => {
            let erupt = eb.eruptModel.eruptJson;
            erupt.rowOperation = {};
            erupt.drills = {};
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
            url: RestPath.data + "table/" + value,
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
        this.eruptBuildModel = null;
        if (this.searchErupt) {
            this.searchErupt.eruptFieldModels = [];
        }
        //put table api header
        this.stConfig.req.headers = req.header;
        this.stConfig.url = req.url;
        observable.subscribe(eb => {
                this.layoutTree = !!eb.eruptModel.eruptJson.layoutTree;
                this.dataHandler.initErupt(eb);
                callback && callback(eb);
                this.eruptBuildModel = eb;
                this.buildTabErupt();
                this.buildTableConfig();
                this.searchErupt = this.dataHandler.buildSearchErupt(this.eruptBuildModel);
            }
        );
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

    query(param?: any) {
        if (this.searchErupt.eruptFieldModels.length > 0) {
            this.stConfig.req.param = this.dataHandler.searchEruptToObject({
                eruptModel: this.searchErupt
            });
        }
        this.st.load(1, Object.assign(this.stConfig.req.param, param));
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
                className: "text-center",
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
        }
        // _columns.push({ title: "#", type: "no", fixed: "left", className: "text-center", width: "60px" });
        let viewCols = this.dataHandler.viewToAlainTableConfig(this.eruptBuildModel.eruptModel, true);
        for (let viewCol of viewCols) {
            viewCol.show = true;
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
                        nzWrapClassName: "modal-lg",
                        nzStyle: {top: "60px"},
                        nzMaskClosable: true,
                        nzKeyboard: true,
                        nzCancelText: "关闭（ESC）",
                        nzOkText: null,
                        nzTitle: "查看",
                        nzContent: EditComponent,
                        nzComponentParams: {
                            eruptBuildModel: deepCopy(this.eruptBuildModel),
                            id: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                            behavior: "readonly"
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
                            behavior: "edit",
                            eruptBuildModel: this.eruptBuildModel,
                            id: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]
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
                                this.st.reload();
                                this.msg.success("删除成功");
                            }
                        });
                }
            });
        }
        const that = this;
        for (let key in this.eruptBuildModel.eruptModel.eruptJson.rowOperation) {
            let ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperation[key];
            if (!ro.icon) {
                ro.icon = "fa fa-ravelry";
            }
            tableOperators.push({
                type: 'link',
                text: ro.title,
                // format: () => {
                //     return `<i title="${ro.title}" class="${ro.icon}" style="color: #000"></i>`;
                // },
                click: (record: any, modal: any) => {
                    that.createOperator(key, false, record);
                }
            });
        }
        //drill
        const eruptJson = this.eruptBuildModel.eruptModel.eruptJson;
        for (let key in eruptJson.drills) {
            let drill = eruptJson.drills[key];
            tableOperators.push({
                type: 'link',
                text: drill.title,
                click: (record) => {
                    let drill = eruptJson.drills[key];
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
                                code: key,
                                val: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                                erupt: drill.link.eruptClass,
                                eruptParent: this.eruptBuildModel.eruptModel.eruptName
                            }
                        }
                    })
                }
            });
        }
        if (tableOperators.length > 0) {
            let width = 0;
            for (let key in eruptJson.rowOperation) {
                width += (eruptJson.rowOperation[key].title.length * 20)
            }
            for (let key in eruptJson.drills) {
                width += (eruptJson.drills[key].title.length * 20)
            }
            _columns.push({
                title: "操作",
                fixed: "right",
                width: (width + 120) + "px",
                className: "text-center",
                buttons: tableOperators
            });
        }
        this.columns = _columns;
    }

    /**
     *  自定义功能触发
     * @param code 编码
     * @param multi 是否为多选执行
     * @param data 数据（单个执行时使用）
     */
    createOperator(code: string, multi: boolean, data?: object) {
        if (multi) {
            if (!this.selectedRows || this.selectedRows.length == 0) {
                this.msg.warning("执行该操作时请至少选中一条数据");
                return;
            }
        }
        const eruptModel = this.eruptBuildModel.eruptModel;
        const ro = eruptModel.eruptJson.rowOperation[code];
        let operationErupt = null;
        if (this.eruptBuildModel.operationErupts) {
            operationErupt = this.eruptBuildModel.operationErupts[code];
        }

        let ids = [];
        this.selectedRows.forEach(e => {
            ids.push(e[eruptModel.eruptJson.primaryKeyCol]);
        });
        if (!multi) {
            ids = [data[eruptModel.eruptJson.primaryKeyCol]];
        }
        if (operationErupt) {
            let modal = this.modal.create({
                nzKeyboard: false,
                nzTitle: ro.title,
                nzMaskClosable: false,
                nzCancelText: "取消",
                nzWrapClassName: "modal-lg",
                nzOnOk: async () => {
                    modal.getInstance().nzCancelDisabled = true;
                    let eruptValue = this.dataHandler.eruptValueToObject({eruptModel: operationErupt});
                    let res = await this.dataService.execOperatorFun(eruptModel.eruptName, code, ids, eruptValue).toPromise().then(res => res);
                    modal.getInstance().nzCancelDisabled = false;
                    if (res.status == Status.SUCCESS) {
                        this.st.reload();
                        return true;
                    } else {
                        return false;
                    }
                },
                nzContent: EditTypeComponent,
                nzComponentParams: {
                    mode: "addNew",
                    eruptBuildModel: {
                        eruptModel: operationErupt
                    },
                    parentEruptName: this.eruptBuildModel.eruptModel.eruptName
                }
            });
        } else {
            this.modal.confirm({
                nzTitle: "请确认是否执行此操作",
                nzContent: ro.title,
                nzOnOk: () => {
                    this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, code, ids, null).subscribe(res => {
                        this.st.reload();
                    });
                }
            });
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
                if (modal.getContentComponent().beforeSaveValidate()) {
                    let res: EruptApiModel;
                    if (this._drill && this._drill.val) {
                        res = await this.dataService.addEruptDrillData(
                            this._drill.eruptParent,
                            this._drill.code,
                            this._drill.val,
                            this.dataHandler.eruptValueToObject(this.eruptBuildModel)).toPromise().then(res => res);
                    } else {
                        res = await this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
                            this.dataHandler.eruptValueToObject(this.eruptBuildModel)).toPromise().then(res => res);
                    }
                    if (res.status === Status.SUCCESS) {
                        this.msg.success("新增成功");
                        this.st.reload();
                        return true;
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
            condition = this.dataHandler.eruptValueToObject({
                eruptModel: this.searchErupt
            });
        }
        //导出接口
        this.dataService.downloadExcel(this.eruptBuildModel.eruptModel.eruptName, condition);
    }


    clickTreeNode(event) {
        this.query(event);
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

