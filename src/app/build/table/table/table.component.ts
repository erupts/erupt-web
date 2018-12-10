import {Component, OnInit, Renderer2, ViewChild} from '@angular/core';
import {DataService} from "../../../erupt/service/data.service";
import {Page} from "../../../erupt/model/page";
import {EruptModel} from "../../../erupt/model/erupt.model";
import {EruptFieldModel} from "../../../erupt/model/erupt-field.model";
import {
    eruptValueToObject, initErupt, objectToEruptValue, viewToAlainTableConfig
} from "../../../erupt/util/conver-util";
import {EditType} from "../../../erupt/model/erupt.enum";
import {DrawerHelper, ModalHelper, SettingsService} from "@delon/theme";
import {EditTypeComponent} from "../../../erupt/edit-type/edit-type.component";
import {EditComponent} from "../edit/edit.component";
import {QRComponent, STData} from "@delon/abc";
import {ActivatedRoute} from "@angular/router";
import {FormControl, FormGroup} from "@angular/forms";
import {NzNotificationService} from "ng-zorro-antd/notification";

@Component({
    selector: 'app-list-view',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.less']
})
export class TableComponent implements OnInit {

    eruptSearchFields: Array<EruptFieldModel> = [];

    constructor(private dataService: DataService,
                private settingSrv: SettingsService,
                private modalHelper: ModalHelper,
                private drawerHelper: DrawerHelper,
                private renderer: Renderer2,
                public route: ActivatedRoute) {

    }

    eruptName: string = "";

    eruptModel: EruptModel;

    page: Page = {
        pageNumber: 0,
        pageSize: 10,
        total: 10
    };

    rows: any;

    rowData: any;

    operatorEdit: [Array<EruptFieldModel>, string] = [[], ""];


    selectedRows: Array<any> = [];

    columns = [];

    @ViewChild('editDrawer') editDrawer;

    ngOnInit() {
        // this.modalHelper.create(QRComponent, {value: "http://www.baidu.com",size:"100"}).subscribe(s => {
        //
        // });
        this.route.params.subscribe((params) => {
            this.eruptName = params.name;
        });

        this.dataService.getEruptBuild(this.eruptName).subscribe(
            em => {
                this.eruptModel = em;
                initErupt(this.eruptModel);
                this.buildTableConfig();
                em.eruptFieldModels.forEach((field, i) => {
                    //根据TAb类型获取subEruptModels结构
                    if (field.eruptFieldJson.edit.type === EditType.TAB) {
                        this.eruptModel.subEruptModels = [];
                        this.dataService.getEruptBuild(field.fieldReturnName).subscribe(
                            subEm => {
                                initErupt(subEm);
                                let columns = viewToAlainTableConfig(this.eruptModel.tableColumns);
                                columns.push({
                                    fixed: 'right',
                                    width: '100px',
                                    title: '操作区',
                                    buttons: [
                                        {
                                            icon: 'edit',
                                            click: (record: any, modal: any) => {
                                                objectToEruptValue(subEm, record);
                                                this.modalHelper.createStatic(EditTypeComponent, {
                                                    eruptFieldModels: subEm.eruptFieldModels,
                                                    eruptName: subEm.eruptName
                                                }, {
                                                    modalOptions: {
                                                        nzTitle: "操作",
                                                        nzFooter: [{
                                                            label: "确定",
                                                            size: "large",
                                                            onClick: (data) => {
                                                                console.log(data);
                                                            }
                                                        }]
                                                    }
                                                }).subscribe(f => {

                                                })
                                            }
                                        },
                                        {
                                            icon: {
                                                type: "delete",
                                                theme: "twotone",
                                                twoToneColor: "#f00",
                                            },
                                        }
                                    ]
                                });
                                this.eruptModel.subEruptModels.push({
                                    eruptModel: subEm,
                                    eruptField: field,
                                    columns: columns
                                });
                            }
                        );
                    }
                    //search Edit
                    if (field.eruptFieldJson.edit.search.isSearch) {
                        field.eruptFieldJson.edit.notNull = false;
                        this.eruptSearchFields.push(field);
                    }
                });
            }
        );

        this.dataService.queryEruptData(this.eruptName, {}).subscribe(
            data => {
                this.rows = data.list;
            }
        );
    }

    buildTableConfig() {
        const that = this;
        this.columns.push({title: '', type: 'checkbox', fixed: 'left', index: this.eruptModel.primaryKeyCol});
        this.columns.push({title: 'No', type: 'no', fixed: 'left', width: "60px"});
        this.columns.push(...viewToAlainTableConfig(this.eruptModel.tableColumns));
        const operators = [];
        this.eruptModel.eruptJson.rowOperation.forEach(ro => {
            if (!ro.multi) {
                operators.push({
                    icon: ro.icon,
                    click: (record: any, modal: any) => {
                        that.gcOperatorEdits(ro.code);

                        this.modalHelper.create(this.operatorEdit[0].length > 0 ? EditTypeComponent : "请确认操作", {
                            eruptFieldModels: this.operatorEdit[0],
                            eruptName: this.operatorEdit[1]
                        }, {
                            modalOptions: {
                                nzTitle: "功能",
                                nzFooter: [{
                                    label: "确定",
                                    size: "large",
                                    onClick: (data) => {

                                    }
                                }]
                            }
                        }).subscribe(s => {
                            console.log(s);
                        })
                    }
                });
            }
        });

        if (operators.length > 0) {
            this.columns.push({
                title: '功能',
                className: 'text-center',
                fixed: 'right',
                width: '100px',
                buttons: [...operators]
            });
        }

        this.columns.push({
            fixed: 'right',
            width: '100px',
            title: '操作区',
            buttons: [
                {
                    icon: 'edit',
                    click: (record: any, modal: any) => {
                        this.drawerHelper.static("编辑", EditComponent, {
                            eruptModel: this.eruptModel,
                            rowDataFun: record
                        }, {
                            footer: false,
                            size: 'lg'
                        }).subscribe(s => {

                        })

                        // const drawerRef = this.drawerService.create({
                        //     nzTitle: '编辑',
                        //     nzContent: this.editDrawer,
                        //     nzContentParams: {
                        //         rowData: record
                        //     }
                        // });
                    }
                },
                {
                    icon: {
                        type: "delete",
                        theme: "twotone",
                        twoToneColor: "#f00",
                    },
                    type: 'del',
                    click: (record, modal, comp) => {
                        this.dataService.deleteEruptData(this.eruptName, record[this.eruptModel.primaryKeyCol]).subscribe(val => {

                            // this.message.success(`成功删除`);
                            comp.removeRow(record);
                        });

                    },
                }
            ]
        });
    }


    gcOperatorEdits(code: string) {
        this.operatorEdit[0] = [];
        const ro = this.eruptModel.eruptJson.rowOperationMap.get(code);
        ro.edits.forEach(edit => {
            const eruptFieldModel: EruptFieldModel = {
                fieldName: edit.code,
                fieldReturnName: edit.codeType,
                eruptFieldJson: {
                    edit: edit.edit
                }
            };
            this.operatorEdit[0].push(eruptFieldModel);
        });
        this.operatorEdit[1] = code;
    }

    tableDataChange(data: STData) {
        this.selectedRows = data.checkbox;
    }

    editRow(event: Event, value) {
        event.stopPropagation();
        // const modalOptions = new ModalOptions();
        // modalOptions.class = "gray modal-lg m-t-60";
        // modalOptions.ignoreBackdropClick = true;
        // modalOptions.keyboard = false;
        // this.rowData = value;
        // this.editModalRef = this.modalService.show(this.editModal, modalOptions);
    }

    addRow(event: Event, value) {
        this.modalHelper.createStatic(EditComponent, {eruptModel: this.eruptModel}, {
            modalOptions: {
                nzStyle: {
                    top: '20px'
                }
            }
        }).subscribe()
    }


    delRows() {
        const ids = [];
        this.selectedRows.forEach(e => {
            ids.push(e[this.eruptModel.primaryKeyCol]);
        });
        console.log(ids);
        this.dataService.deleteEruptDatas(this.eruptName, ids).subscribe(val => {
            console.log(val);
        });
    }

    saveData() {
        // if (EruptCheckReqDataByToastr(this.eruptModel, this.toastr)) {
        //     this.dataService.addEruptData(
        //         this.eruptModel.eruptName, eruptValueToObject(this.eruptModel)
        //     ).subscribe(result => {
        //         console.log(result);
        //     });
        // }
    }

    actionOperator(operatorEdit: [Array<EruptFieldModel>, string]) {
        // const param = eruptValueToObject({
        //     eruptFieldModels: operatorEdit[0],
        //     eruptJson: null,
        //     eruptName: this.eruptModel.eruptName,
        //     primaryKeyCol: this.eruptModel.primaryKeyCol
        // });
        // const selectKeys = [];
        // this.selectedRows.forEach(row => {
        //     selectKeys.push(row[this.eruptModel.primaryKeyCol]);
        // });
        // if (selectKeys.length !== 0) {
        //     this.dataService.execOperatorFun(this.eruptModel.eruptName, operatorEdit[1], selectKeys, param).subscribe(resp => {
        //         console.log(resp);
        //     });
        // } else {
        //     this.toastr.clear();
        //     this.toastr.warning("未选中数据");
        // }

    }

    onSelectTableRow(event) {
        this.selectedRows = event.selected;
    }


    exportExcel() {
        this.renderer;
        window.open(window["domain"] + "/erupt-api/excel/export/" + this.eruptModel.eruptName);
        // this.dataService.downloadEruptExcel(this.eruptModel.eruptName).subscribe();
    }

}

