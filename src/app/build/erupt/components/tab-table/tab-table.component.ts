import {Component, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {STColumn, STColumnButton, STComponent} from "@delon/abc";
import {EditTypeComponent} from "../edit-type/edit-type.component";
import {colRules} from "@shared/model/util.model";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {ReferenceTableComponent} from "../reference-table/reference-table.component";
import {BuildConfig} from "../../model/build-config";
import {Status} from "../../model/erupt-api.model";
import {EditType, Scene, SelectMode} from "../../model/erupt.enum";
import {UiBuildService} from "../../service/ui-build.service";
import {ALAIN_I18N_TOKEN} from "@delon/theme";
import {I18NService} from "@core";

@Component({
    selector: "tab-table",
    templateUrl: "./tab-table.component.html",
    styles: [],
    styleUrls: ["./tab-table.component.less"]
})
export class TabTableComponent implements OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() tabErupt: {
        eruptBuildModel: EruptBuildModel;
        eruptFieldModel: EruptFieldModel;
    };

    @Input() mode: "refer-add" | "add" = "add";

    @ViewChild("st", {static: false}) st: STComponent;

    @Input() onlyRead: boolean = false;

    column: STColumn[];

    checkedRow = [];

    stConfig = new BuildConfig().stConfig;

    constructor(private dataService: DataService,
                private uiBuildService: UiBuildService,
                private dataHandlerService: DataHandlerService,
                @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit() {
        this.stConfig.stPage.front = true;
        if (!this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value) {
            this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value = [];
        }
        if (this.onlyRead) {
            this.column = this.uiBuildService.viewToAlainTableConfig(this.tabErupt.eruptBuildModel, false, true);
        } else {
            const viewValue: STColumn[] = [];
            viewValue.push({
                title: "",
                type: "checkbox",
                width: "50px",
                fixed: "left",
                className: "text-center",
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
            viewValue.push(...this.uiBuildService.viewToAlainTableConfig(this.tabErupt.eruptBuildModel, false, true));
            let operators: STColumnButton[] = [];
            if (this.mode == "add") {
                operators.push({
                    icon: "edit",
                    click: (record: any, modal: any, comp: STComponent) => {
                        this.dataHandlerService.objectToEruptValue(record, this.tabErupt.eruptBuildModel);
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "20px"},
                            nzMaskClosable: false,
                            nzKeyboard: false,
                            nzTitle: this.i18n.fanyi("global.editor"),
                            nzContent: EditTypeComponent,
                            nzComponentParams: {
                                col: colRules[3],
                                eruptBuildModel: this.tabErupt.eruptBuildModel,
                                parentEruptName: this.eruptBuildModel.eruptModel.eruptName
                            },
                            nzOnOk: async () => {
                                let obj = this.dataHandlerService.eruptValueToObject(this.tabErupt.eruptBuildModel);

                                let result = await this.dataService.eruptDataValidate(this.tabErupt.eruptBuildModel.eruptModel.eruptName
                                    , obj, this.eruptBuildModel.eruptModel.eruptName).toPromise().then(resp => resp);
                                if (result.status == Status.SUCCESS) {
                                    let $value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
                                    $value.forEach((val, index) => {
                                        let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
                                        if (record[tabPrimaryKeyCol] == val[tabPrimaryKeyCol]) {
                                            $value[index] = obj;
                                        }
                                    });
                                    this.st.reload();
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        });
                    }
                });
            }
            operators.push({
                icon: {
                    type: "delete",
                    theme: "twotone",
                    twoToneColor: "#f00"
                },
                type: "del",
                click: (record, modal, comp: STComponent) => {
                    let $value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
                    for (let i in <any[]>$value) {
                        let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
                        if (record[tabPrimaryKeyCol] == $value[i][tabPrimaryKeyCol]) {
                            $value.splice(i, 1);
                            break;
                        }
                    }
                    this.st.reload();
                }
            });
            viewValue.push({
                title: this.i18n.fanyi("table.operation"),
                fixed: "right",
                width: "80px",
                className: "text-center",
                buttons: operators
            });
            this.column = viewValue;
        }
    }

    addData() {
        // this.dataHandlerService.emptyEruptValue(this.tabErupt.eruptBuildModel);
        this.dataService.getInitValue(this.tabErupt.eruptBuildModel.eruptModel.eruptName, this.eruptBuildModel.eruptModel.eruptName).subscribe(data => {
            this.dataHandlerService.objectToEruptValue(data, this.tabErupt.eruptBuildModel);
            this.modal.create({
                nzWrapClassName: "modal-lg",
                nzStyle: {top: "50px"},
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: this.i18n.fanyi("global.add"),
                nzContent: EditTypeComponent,
                nzComponentParams: {
                    mode: Scene.ADD,
                    eruptBuildModel: this.tabErupt.eruptBuildModel,
                    parentEruptName: this.eruptBuildModel.eruptModel.eruptName
                },
                nzOnOk: async () => {
                    let obj = this.dataHandlerService.eruptValueToObject(this.tabErupt.eruptBuildModel);
                    let result = await this.dataService.eruptDataValidate(this.tabErupt.eruptBuildModel.eruptModel.eruptName
                        , obj, this.eruptBuildModel.eruptModel.eruptName).toPromise().then(resp => resp);
                    if (result.status == Status.SUCCESS) {
                        obj[this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol] = -Math.floor(Math.random() * 1000);
                        let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
                        if (!edit.$value) {
                            edit.$value = [];
                        }
                        edit.$value.push(obj);
                        this.st.reload();
                        return true;
                    } else {
                        return false;
                    }
                }
            });
        });
    }

    addDataByRefer() {
        this.modal.create({
            nzStyle: {top: "20px"},
            nzWrapClassName: "modal-xxl",
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.new"),
            nzContent: ReferenceTableComponent,
            nzComponentParams: {
                eruptBuild: this.eruptBuildModel,
                eruptField: this.tabErupt.eruptFieldModel,
                mode: SelectMode.checkbox,
                tabRef: true
            },
            nzOkText: this.i18n.fanyi("global.add"),
            nzOnOk: () => {
                let tabEruptModel = this.tabErupt.eruptBuildModel.eruptModel;
                let edit = this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
                if (!edit.$tempValue) {
                    this.msg.warning(this.i18n.fanyi("global.select.one"));
                    return false;
                }
                if (!edit.$value) {
                    edit.$value = [];
                }

                for (let v of edit.$tempValue) {
                    for (let key in v) {
                        let eruptFieldModel = tabEruptModel.eruptFieldModelMap.get(key);
                        if (eruptFieldModel) {
                            let ed = eruptFieldModel.eruptFieldJson.edit;
                            switch (ed.type) {
                                case EditType.BOOLEAN:
                                    v[key] = v[key] === ed.boolType.trueText;
                                    break;
                                case EditType.CHOICE:
                                    for (let vl of eruptFieldModel.choiceList) {
                                        if (vl.label == v[key]) {
                                            v[key] = vl.value;
                                            break;
                                        }
                                    }
                                    break;
                            }
                        }
                        if (key.indexOf("_") != -1) {
                            let kk = key.split("_");
                            v[kk[0]] = v[kk[0]] || {};
                            v[kk[0]][kk[1]] = v[key];
                        }
                    }
                }
                edit.$value.push(...edit.$tempValue);
                //去重
                edit.$value = Array.from(new Set(edit.$value));

                this.st.reload();
            }
        });
    }

    selectTableItem(event) {
        if (event.type === "checkbox") {
            this.checkedRow = event.checkbox;
        }
    }

    deleteData() {
        if (this.checkedRow.length) {
            let value = this.tabErupt.eruptFieldModel.eruptFieldJson.edit.$value;
            for (let i in <any[]>value) {
                let tabPrimaryKeyCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
                this.checkedRow.forEach((cr) => {
                    if (cr[tabPrimaryKeyCol] == value[i][tabPrimaryKeyCol]) {
                        value.splice(i, 1);
                    }
                });
            }
            this.st.reload();
            this.checkedRow = [];
        } else {
            this.msg.warning(this.i18n.fanyi("global.delete.hint.check"));
        }
    }


}
