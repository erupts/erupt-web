import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {DataService} from "../../../erupt/service/data.service";
import {Page} from "../../../erupt/model/page";
import {EruptModel} from "../../../erupt/model/erupt.model";
import {EruptFieldModel, View, EruptField} from "../../../erupt/model/erupt-field.model";
import {
    eruptValueToObject, initErupt, viewToAlainTableConfig
} from "../../../erupt/util/conver-util";
import {EditType} from "../../../erupt/model/erupt.enum";
import {EruptCheckReqData, EruptCheckReqDataByToastr} from "../../../erupt/util/erupt-util";
import {ToastrService} from "ngx-toastr";
import {NzMessageService} from "ng-zorro-antd/message";
import {EditComponent} from "../edit/edit.component";
import {SettingsService} from "@delon/theme";

@Component({
    selector: 'app-list-view',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

    eruptSearchFields: Array<EruptFieldModel> = [];

    constructor(private dataService: DataService, private toastr: ToastrService, private settingSrv: SettingsService) {

    }

    eruptName: string = "mmo";

    eruptModel: EruptModel;

    page: Page = {
        pageNumber: 0,
        pageSize: 10,
        total: 10
    };

    rows: any;

    isSearchCollapsed: boolean = false;

    //editModel variables
    // @ViewChild("editModal") editModal: TemplateRef<any>;


    rowData: any;

    operatorEdit: [Array<EruptFieldModel>, string] = [[], ""];


    selectedRows = [];

    columns = [];

    editDrawerVisible: boolean = false;

    ngOnInit() {
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
                                this.eruptModel.subEruptModels.push({
                                    eruptModel: subEm,
                                    eruptField: field
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
        this.columns.push({title: '', type: 'checkbox', fixed: 'left'});
        this.columns.push({title: 'No', type: 'no', fixed: 'left', width: "60px"});
        this.columns.push(...viewToAlainTableConfig(this.eruptModel.tableColumns));
        const operators = [];
        this.eruptModel.eruptJson.rowOperation.forEach(ro => {
            if (!ro.multi) {
                operators.push({
                    icon: ro.icon,
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
                        this.editDrawerVisible = true;
                    }
                },
                {
                    icon: "delete"
                }
            ]
        });
    }


    gcOperatorEdits(code: string) {
        this.operatorEdit[0] = [];
        for (const ro of this.eruptModel.eruptJson.rowOperation) {
            if (ro.code === code) {
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
                return;
            }
        }
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
        this.editRow(event, null);

    }

    delRow(event: Event, value) {
        event.stopPropagation();
        this.dataService.deleteEruptData(this.eruptName, value[this.eruptModel.primaryKeyCol]).subscribe(val => {
            console.log(val);
        });
    }

    saveData() {
        if (EruptCheckReqDataByToastr(this.eruptModel, this.toastr)) {
            this.dataService.addEruptData(
                this.eruptModel.eruptName, eruptValueToObject(this.eruptModel)
            ).subscribe(result => {
                console.log(result);
            });
        }
    }

    actionOperator(operatorEdit: [Array<EruptFieldModel>, string]) {
        const param = eruptValueToObject({
            eruptFieldModels: operatorEdit[0],
            eruptJson: null,
            eruptName: this.eruptModel.eruptName,
            primaryKeyCol: this.eruptModel.primaryKeyCol
        });
        const selectKeys = [];
        this.selectedRows.forEach(row => {
            selectKeys.push(row[this.eruptModel.primaryKeyCol]);
        });
        if (selectKeys.length !== 0) {
            this.dataService.execOperatorFun(this.eruptModel.eruptName, operatorEdit[1], selectKeys, param).subscribe(resp => {
                console.log(resp);
            });
        } else {
            this.toastr.clear();
            this.toastr.warning("未选中数据");
        }

    }

    onSelectTableRow(event) {
        this.selectedRows = event.selected;
    }

}

