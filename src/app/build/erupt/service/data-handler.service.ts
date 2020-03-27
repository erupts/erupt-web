import {Edit, EruptFieldModel} from "../model/erupt-field.model";
import {EruptModel, Tree} from "../model/erupt.model";
import {ChoiceEnum, DateEnum, DependSwitchTypeEnum, EditType, SaveMode, ViewType} from "../model/erupt.enum";
import {FormControl} from "@angular/forms";
import {NzMessageService, NzModalService, UploadFile} from "ng-zorro-antd";
import {deepCopy} from "@delon/util";
import {Inject, Injectable} from "@angular/core";
import {EruptBuildModel} from "../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {ViewTypeComponent} from "../components/view-type/view-type.component";
import {STColumn, STData} from "@delon/abc";
import {DatePipe} from "@angular/common";
import {CodeEditorViewComponent} from "../components/code-editor-view/code-editor-view.component";

/**
 * Created by liyuepeng on 10/31/18.
 */

@Injectable()
export class DataHandlerService {

    constructor(
        @Inject(NzModalService) private modal: NzModalService,
        @Inject(NzMessageService) private msg: NzMessageService) {
    }

    initErupt(em: EruptBuildModel) {
        this.buildErupt(em.eruptModel);
        if (em.tabErupts) {
            for (let key in em.tabErupts) {
                if ("eruptName" in em.tabErupts[key].eruptModel) {
                    this.initErupt(em.tabErupts[key]);
                }
            }
        }
        if (em.combineErupts) {
            for (let key in em.combineErupts) {
                this.buildErupt(em.combineErupts[key]);
            }
        }
        if (em.referenceErupts) {
            for (let key in em.referenceErupts) {
                this.buildErupt(em.referenceErupts[key]);
            }
        }
    }

    buildErupt(eruptModel: EruptModel) {
        eruptModel.tableColumns = [];
        eruptModel.eruptFieldModelMap = new Map<String, EruptFieldModel>();
        eruptModel.eruptFieldModels.forEach(field => {
            if (!field.eruptFieldJson.edit) {
                return;
            }
            field.eruptFieldJson.edit.$value = field.value;
            eruptModel.eruptFieldModelMap.set(field.fieldName, field);
            switch (field.eruptFieldJson.edit.type) {
                case EditType.INPUT:
                    const inputType = field.eruptFieldJson.edit.inputType;
                    if (inputType.prefix.length > 0) {
                        inputType.prefixValue = inputType.prefix[0].value;
                    }
                    if (inputType.suffix.length > 0) {
                        inputType.suffixValue = inputType.suffix[0].value;
                    }
                    break;
                case EditType.SLIDER:
                    const markPoints = field.eruptFieldJson.edit.sliderType.markPoints;
                    const marks = field.eruptFieldJson.edit.sliderType.marks = {};
                    if (markPoints.length > 0) {
                        markPoints.forEach(m => {
                            marks[m] = "";
                        });
                    }
                    break;
            }
            //生成columns
            field.eruptFieldJson.views.forEach(view => {
                if (!view.show) {
                    return;
                }
                if (view.column) {
                    view.column = field.fieldName + "." + view.column.replace("\.", "_");
                } else {
                    view.column = field.fieldName;
                }
                const deepField = <EruptFieldModel>deepCopy(field);
                deepField.eruptFieldJson.views = null;
                view.eruptFieldModel = deepField;
                eruptModel.tableColumns.push(view);
            });
        });
        //生成depend组件代码
        eruptModel.eruptFieldModels.forEach(field => {
            if (!field.eruptFieldJson.edit) {
                return;
            }
            if (field.eruptFieldJson.edit.type === EditType.DEPEND_SWITCH) {
                let type = field.eruptFieldJson.edit.dependSwitchType.type;
                field.eruptFieldJson.edit.dependSwitchType.attr.forEach(attr => {
                    if (field.value && field.value === attr.value) {
                        return;
                    } else {
                        attr.dependEdits.forEach(editName => {
                            const fm = eruptModel.eruptFieldModelMap.get(editName);
                            if (fm) {
                                if (type === DependSwitchTypeEnum.HIDDEN) {
                                    fm.eruptFieldJson.edit.show = false;
                                } else {
                                    fm.eruptFieldJson.edit.readOnly = true;
                                }
                            }
                        });
                    }
                });
            }
        });
    }


    buildSearchErupt(eruptBuildModel: EruptBuildModel): EruptModel {
        let copyErupt = <EruptModel>deepCopy(eruptBuildModel.eruptModel);
        const searchFieldModels = [];
        const searchFieldModelsMap: Map<String, EruptFieldModel> = new Map();
        copyErupt.eruptFieldModels.forEach((field) => {
            if (!field.eruptFieldJson.edit) {
                return;
            }
            searchFieldModelsMap.set(field.fieldName, field);
            if (field.eruptFieldJson.edit.search.value) {
                field.value = null;
                field.eruptFieldJson.edit.notNull = field.eruptFieldJson.edit.search.notNull;
                field.eruptFieldJson.edit.show = true;
                field.eruptFieldJson.edit.readOnly = false;
                field.eruptFieldJson.edit.$value = null;
                field.eruptFieldJson.edit.$viewValue = null;
                field.eruptFieldJson.edit.$tempValue = null;
                searchFieldModels.push(field);
            }
        });
        copyErupt.mode = "search";
        copyErupt.eruptFieldModels = searchFieldModels;
        copyErupt.eruptFieldModelMap = searchFieldModelsMap;
        return copyErupt;
    }

    /**
     * 将view数据转换为alain table组件配置信息
     * @param erupt
     * @param lineData
     *     true   数据形式为一整行txt
     *     false  数据形式为：带有层级的json
     * @param tfBool
     */
    viewToAlainTableConfig(erupt: EruptModel, lineData: boolean, tfBool?: boolean): STColumn[] {
        let cols: STColumn[] = [];
        const views = erupt.tableColumns;
        for (let view of views) {
            let edit = view.eruptFieldModel.eruptFieldJson.edit;
            let obj: STColumn = {
                // width: "200px",
                title: view.title
            };
            if (lineData) {
                obj.index = view.column.replace(".", "_");
            } else {
                obj.index = view.column;
            }
            if (view.sortable) {
                obj.sort = {
                    reName: {
                        ascend: "asc",
                        descend: "desc"
                    },
                    key: view.column,
                    compare: ((a: STData, b: STData) => {
                        return a[view.column] > b[view.column] ? 1 : -1;
                    })
                };
            }
            //展示类型
            switch (view.viewType) {
                case ViewType.BOOLEAN:
                    obj.type = "yn";
                    obj.className = "text-center";
                    if (!tfBool) {
                        obj.yn = {
                            truth: edit.boolType.trueText
                        };
                    }
                    break;
                case ViewType.NUMBER:
                    obj.className = "text-right";
                    break;
                case ViewType.DATE:
                    obj.className = "date-col";
                    break;
                case ViewType.LINK:
                    obj.type = "link";
                    obj.click = (item) => {
                        window.open(item[view.column]);
                    };
                    break;
                case ViewType.LINK_DIALOG:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg modal-body-nopadding",
                            nzStyle: {top: "20px"},
                            nzMaskClosable: false,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.QR_CODE:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-qrcode' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-sm",
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.CODE_EDITOR:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-code' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzBodyStyle: {
                                padding: 0
                            },
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: CodeEditorViewComponent,
                            nzComponentParams: {
                                language: view.eruptFieldModel.eruptFieldJson.edit.codeEditType.language,
                                value: item[view.column]
                            }
                        });
                    };
                    break;
                case ViewType.MAP:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-map' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzBodyStyle: {
                                padding: 0
                            },
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.IMAGE:
                    obj.type = "link";
                    obj.width = "90px";
                    obj.className = "text-center p-sm";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            const attachmentType = view.eruptFieldModel.eruptFieldJson.edit.attachmentType;
                            if (attachmentType) {
                                let img = (<string>item[view.column]).split(attachmentType.fileSeparator)[0];
                                return `<img height="50px" class="text-center" src="${DataService.previewAttachment(img)}" />`;
                            } else {
                                return `<img height="50px" class="text-center" src="${DataService.previewAttachment(item[view.column])}" />`;
                            }
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.HTML:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-file-text' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.SWF:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-file-image-o' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg modal-body-nopadding",
                            nzStyle: {top: "40px"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.ATTACHMENT_DIALOG:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-dot-circle-o' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg modal-body-nopadding",
                            nzStyle: {top: "30px"},
                            nzKeyboard: true,
                            nzFooter: null,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[view.column],
                                view: view
                            }
                        });
                    };
                    break;
                case ViewType.DOWNLOAD:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-download' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        window.open(DataService.downloadAttachment(item[view.column]));
                    };
                    break;
                case ViewType.ATTACHMENT:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<i class='fa fa-window-restore' aria-hidden='true'></i>`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        window.open(DataService.previewAttachment(item[view.column]));
                    };
                    break;
            }
            if (view.template) {
                obj.format = (item: any) => {
                    try {
                        return eval(view.template);
                    } catch (e) {
                        console.error(e);
                        this.msg.error(e.toString());
                    }
                };
            }
            if (view.className) {
                obj.className += " " + view.className;
            }
            cols.push(obj);
        }
        return cols;
    }


    //非空验证
    validateNotNull(eruptModel: EruptModel, combineErupt?: { [key: string]: EruptModel }): boolean {
        for (let field of eruptModel.eruptFieldModels) {
            if (field.eruptFieldJson.edit.notNull) {
                if (!field.eruptFieldJson.edit.$value) {
                    this.msg.error(field.eruptFieldJson.edit.title + "必填！");
                    return false;
                }
            }
        }
        if (combineErupt) {
            for (let key in combineErupt) {
                if (!this.validateNotNull(combineErupt[key])) {
                    return false;
                }
            }
        }
        return true;
    }

    dataTreeToZorroTree(nodes: Tree[]) {
        const tempNodes = [];
        nodes.forEach(node => {
            let option: any = {
                key: node.id,
                title: node.label,
                data: node.data,
                expanded: true
            };
            if (node.children && node.children.length > 0) {
                tempNodes.push(option);
                option.children = this.dataTreeToZorroTree(node.children);
            } else {
                option.isLeaf = true;
                tempNodes.push(option);
            }
        });
        return tempNodes;
    }

    searchEruptToObject(eruptBuildModel: EruptBuildModel): object {
        const obj = this.eruptValueToObject(eruptBuildModel);
        eruptBuildModel.eruptModel.eruptFieldModels.forEach(field => {
            const edit = field.eruptFieldJson.edit;
            if (edit.search.value) {
                if (edit.search.vague) {
                    switch (edit.type) {
                        case EditType.CHOICE:
                            let arr = [];
                            for (let vl of edit.choiceType.vl) {
                                if (vl.$viewValue) {
                                    arr.push(vl.value);
                                }
                            }
                            obj[field.fieldName] = arr;
                            break;
                        case EditType.NUMBER:
                            if (edit.$l_val && edit.$r_val) {
                                obj[field.fieldName] = [edit.$l_val, edit.$r_val];
                            }
                            break;
                        case EditType.DATE:
                            if (edit.$value) {
                                if (edit.dateType.type == DateEnum.DATE) {
                                    obj[field.fieldName] = [this.datePipe.transform(edit.$value[0], "yyyy-MM-dd 00:00:00"),
                                        this.datePipe.transform(edit.$value[1], "yyyy-MM-dd 23:59:59")];
                                } else if (edit.dateType.type == DateEnum.DATE_TIME) {
                                    obj[field.fieldName] = [this.datePipe.transform(edit.$value[0], "yyyy-MM-dd HH:mm:ss"),
                                        this.datePipe.transform(edit.$value[1], "yyyy-MM-dd HH:mm:ss")];
                                }
                            }
                    }
                }
            }
        });
        return obj;
    }

    private datePipe: DatePipe = new DatePipe("zh-cn");

    dateFormat(date, edit: Edit): string {
        let format = null;
        switch (edit.dateType.type) {
            case DateEnum.DATE:
                format = "yyyy-MM-dd";
                break;
            case DateEnum.DATE_TIME:
                format = "yyyy-MM-dd HH:mm:ss";
                break;
            case DateEnum.MONTH:
                format = "yyyy-MM";
                break;
            case DateEnum.WEEK:
                format = "yyyy-ww";
                break;
            case DateEnum.YEAR:
                format = "yyyy";
                break;
            case DateEnum.TIME:
                format = "HH:mm:ss";
                break;
        }
        return this.datePipe.transform(date, format);
    }

    //将eruptModel中的内容拼接成后台需要的json格式
    eruptValueToObject(eruptBuildModel: EruptBuildModel): object {
        const eruptData: any = {};
        eruptBuildModel.eruptModel.eruptFieldModels.forEach(field => {
            const edit = field.eruptFieldJson.edit;
            if (edit) {
                switch (edit.type) {
                    case EditType.INPUT:
                        if (edit.$value) {
                            const inputType = edit.inputType;
                            if (inputType.prefixValue || inputType.suffixValue) {
                                eruptData[field.fieldName] = (inputType.prefixValue || "") + edit.$value + (inputType.suffixValue || "");
                            } else {
                                eruptData[field.fieldName] = edit.$value;
                            }
                        }
                        break;
                    case EditType.CHOICE:
                        if (edit.$value || edit.$value === 0) {
                            if (edit.choiceType.type === ChoiceEnum.SELECT_MULTI ||
                                edit.choiceType.type === ChoiceEnum.TAGS ||
                                edit.choiceType.type === ChoiceEnum.CHECKBOX) {
                                let val = (<string[]>edit.$value).join(edit.choiceType.joinSeparator);
                                if (val) {
                                    eruptData[field.fieldName] = val;
                                }
                            } else {
                                eruptData[field.fieldName] = edit.$value;
                            }
                        }
                        break;
                    case EditType.REFERENCE_TREE:
                        if (edit.$value || edit.$value === 0) {
                            eruptData[field.fieldName] = {};
                            eruptData[field.fieldName][edit.referenceTreeType.id] = edit.$value;
                            eruptData[field.fieldName][edit.referenceTreeType.label] = edit.$viewValue;
                        } else {
                            edit.$value = null;
                        }
                        break;
                    case EditType.REFERENCE_TABLE:
                        if (edit.$value || edit.$value === 0) {
                            eruptData[field.fieldName] = {};
                            eruptData[field.fieldName][edit.referenceTableType.id] = edit.$value;
                            eruptData[field.fieldName][edit.referenceTableType.label] = edit.$viewValue;
                        } else {
                            edit.$value = null;
                        }
                        break;
                    case EditType.TAB_TREE:
                        if (edit.$value) {
                            let ids = [];
                            (<any[]>edit.$value).forEach(val => {
                                const obj = {};
                                obj[eruptBuildModel.tabErupts[field.fieldName].eruptModel.eruptJson.primaryKeyCol] = val;
                                ids.push(obj);
                            });
                            eruptData[field.fieldName] = ids;
                        }
                        break;
                    case EditType.TAB_TABLE_REFER:
                        if (edit.$value) {
                            let ids = [];
                            (<any[]>edit.$value).forEach(val => {
                                const obj = {};
                                let pkc = eruptBuildModel.tabErupts[field.fieldName].eruptModel.eruptJson.primaryKeyCol;
                                obj[pkc] = val[pkc];
                                ids.push(obj);
                            });
                            eruptData[field.fieldName] = ids;
                        }
                        break;
                    case EditType.TAB_TABLE_ADD:
                        if (edit.$value) {
                            eruptData[field.fieldName] = edit.$value;
                        }
                        break;
                    case EditType.ATTACHMENT:
                        if (edit.attachmentType.saveMode === SaveMode.SINGLE_COLUMN) {
                            if (edit.$viewValue) {
                                const $value: string[] = [];
                                (<UploadFile[]>edit.$viewValue).forEach(val => {
                                    $value.push(val.response.data);
                                });
                                eruptData[field.fieldName] = $value.join(edit.attachmentType.fileSeparator);
                            }
                        } else {
                            this.msg.warning("该模式暂不可用");
                        }
                        break;
                    case EditType.BOOLEAN:
                        eruptData[field.fieldName] = edit.$value;
                        break;
                    case EditType.DATE:
                        if (edit.$value) {
                            if (Array.isArray(edit.$value)) {
                                if (!edit.$value[0]) {
                                    edit.$value = null;
                                    break;
                                }
                                eruptData[field.fieldName] = [
                                    this.dateFormat(edit.$value[0], edit),
                                    this.dateFormat(edit.$value[1], edit)
                                ];
                            } else {
                                eruptData[field.fieldName] = this.dateFormat(edit.$value, edit);
                            }
                        }
                        break;
                    case EditType.CODE_EDITOR:
                        let val = edit.$viewValue.getValue();
                        if (val || val === 0) {
                            eruptData[field.fieldName] = val;
                        }
                        break;
                    default:
                        if (edit.$value || edit.$value === 0) {
                            eruptData[field.fieldName] = edit.$value;
                        }
                        break;
                }
            }
        });
        if (eruptBuildModel.combineErupts) {
            for (let key in eruptBuildModel.combineErupts) {
                eruptData[key] = this.eruptValueToObject({
                    eruptModel: eruptBuildModel.combineErupts[key]
                });
            }
        }
        return eruptData;
    }

    eruptValueToTableValue(eruptBuildModel: EruptBuildModel) {
        const eruptData: any = {};
        eruptBuildModel.eruptModel.eruptFieldModels.forEach(field => {
            const edit = field.eruptFieldJson.edit;
            switch (edit.type) {
                case EditType.REFERENCE_TREE:
                    eruptData[field.fieldName + "_" + edit.referenceTreeType.id] = edit.$value;
                    eruptData[field.fieldName + "_" + edit.referenceTreeType.label] = edit.$viewValue;
                    break;
                case EditType.REFERENCE_TABLE:
                    eruptData[field.fieldName + "_" + edit.referenceTableType.id] = edit.$value;
                    eruptData[field.fieldName + "_" + edit.referenceTableType.label] = edit.$viewValue;
                    break;
                default:
                    eruptData[field.fieldName] = edit.$value;
            }
        });
        return eruptData;
    }

    eruptObjectToTableValue(eruptBuildModel: EruptBuildModel, obj: object): any {
        const eruptData: any = {};
        eruptBuildModel.eruptModel.eruptFieldModels.forEach(field => {
            if (obj[field.fieldName] != undefined) {
                const edit = field.eruptFieldJson.edit;
                switch (edit.type) {
                    case EditType.REFERENCE_TREE:
                        eruptData[field.fieldName + "_" + edit.referenceTreeType.id] = obj[field.fieldName][edit.referenceTreeType.id];
                        eruptData[field.fieldName + "_" + edit.referenceTreeType.label] = obj[field.fieldName][edit.referenceTreeType.label];
                        obj[field.fieldName] = null;
                        break;
                    case EditType.REFERENCE_TABLE:
                        eruptData[field.fieldName + "_" + edit.referenceTableType.id] = obj[field.fieldName][edit.referenceTableType.id];
                        eruptData[field.fieldName + "_" + edit.referenceTableType.label] = obj[field.fieldName][edit.referenceTableType.label];
                        obj[field.fieldName] = null;
                        break;
                    default:
                        eruptData[field.fieldName] = obj[field.fieldName];
                }
            }
        });
        return eruptData;
    }

    //将后台数据转化成前端可视格式
    objectToEruptValue(object: any, eruptBuild: EruptBuildModel) {
        this.emptyEruptValue(eruptBuild);
        for (let field of eruptBuild.eruptModel.eruptFieldModels) {
            const edit = field.eruptFieldJson.edit;
            if (edit) {
                switch (edit.type) {
                    case EditType.INPUT:
                        const inputType = edit.inputType;
                        //处理前缀和后缀的数据
                        if (inputType.prefix.length > 0 || inputType.suffix.length > 0) {
                            if (object[field.fieldName]) {
                                let str = <string>object[field.fieldName];
                                for (let pre of inputType.prefix) {
                                    if (str.startsWith(pre.value)) {
                                        edit.inputType.prefixValue = pre.value;
                                        str = str.substr(pre.value.length);
                                        break;
                                    }
                                }
                                for (let suf of inputType.suffix) {
                                    if (str.endsWith(suf.value)) {
                                        edit.inputType.suffixValue = suf.value;
                                        str = str.substr(0, str.length - suf.value.length);
                                        break;
                                    }
                                }
                                edit.$value = str;
                            }
                        } else {
                            edit.$value = object[field.fieldName];
                        }
                        break;
                    case EditType.DATE:
                        edit.$value = new FormControl(object[field.fieldName]).value;
                        break;
                    case EditType.REFERENCE_TREE:
                        if (object[field.fieldName]) {
                            edit.$value = object[field.fieldName][edit.referenceTreeType.id];
                            edit.$viewValue = object[field.fieldName][edit.referenceTreeType.label];
                        }
                        break;
                    case EditType.REFERENCE_TABLE:
                        if (object[field.fieldName]) {
                            edit.$value = object[field.fieldName][edit.referenceTableType.id];
                            edit.$viewValue = object[field.fieldName][edit.referenceTableType.label];
                        }
                        break;
                    case EditType.TAB_TREE:
                        if (!object[field.fieldName]) {
                            edit.$value = [];
                        } else {
                            edit.$value = object[field.fieldName];
                        }
                        break;
                    case EditType.BOOLEAN:
                        if (!object[field.fieldName] && object[field.fieldName] !== false) {
                            edit.$value = edit.boolType.defaultValue;
                        } else {
                            edit.$value = object[field.fieldName];
                        }
                        break;
                    case EditType.ATTACHMENT:
                        if (edit.attachmentType.saveMode === SaveMode.SINGLE_COLUMN) {
                            edit.$viewValue = [];
                            if (object[field.fieldName]) {
                                (<string>object[field.fieldName]).split(edit.attachmentType.fileSeparator)
                                    .forEach(str => {
                                        (<UploadFile[]>edit.$viewValue).push({
                                            uid: str,
                                            name: str,
                                            size: 1,
                                            type: "",
                                            url: DataService.previewAttachment(str),
                                            response: {
                                                data: str
                                            }
                                        });
                                    });
                                edit.$value = object[field.fieldName];
                            }
                        } else {

                        }
                        break;
                    case EditType.CHOICE:
                        if (edit.choiceType.type === ChoiceEnum.SELECT_MULTI || edit.choiceType.type === ChoiceEnum.TAGS
                            || edit.choiceType.type === ChoiceEnum.CHECKBOX) {
                            if (object[field.fieldName]) {
                                edit.$value = String(object[field.fieldName]).split(edit.choiceType.joinSeparator);
                            } else {
                                edit.$value = [];
                            }
                        } else {
                            edit.$value = object[field.fieldName] && object[field.fieldName] + '';
                        }
                        break;
                    default:
                        edit.$value = object[field.fieldName];
                        break;
                }
            }
        }
        if (eruptBuild.combineErupts) {
            for (let key in eruptBuild.combineErupts) {
                this.objectToEruptValue(object[key], {eruptModel: eruptBuild.combineErupts[key]});
            }
        }

    }

    loadEruptDefaultValue(eruptBuildModel: EruptBuildModel) {
        this.emptyEruptValue(eruptBuildModel);
        const obj = {};
        eruptBuildModel.eruptModel.eruptFieldModels.forEach(ef => {
            if (ef.value) {
                obj[ef.fieldName] = ef.value;
            }
        });
        this.objectToEruptValue(obj, {eruptModel: eruptBuildModel.eruptModel});
        for (let key in eruptBuildModel.combineErupts) {
            this.loadEruptDefaultValue({
                eruptModel: eruptBuildModel.combineErupts[key]
            });
        }
    }

    emptyEruptValue(eruptBuildModel: EruptBuildModel) {
        eruptBuildModel.eruptModel.eruptFieldModels.forEach(ef => {
            if (!ef.eruptFieldJson.edit) {
                return;
            }
            ef.eruptFieldJson.edit.$value = null;
            ef.eruptFieldJson.edit.$viewValue = null;
            ef.eruptFieldJson.edit.$tempValue = null;
            ef.eruptFieldJson.edit.$l_val = null;
            ef.eruptFieldJson.edit.$r_val = null;
            switch (ef.eruptFieldJson.edit.type) {
                case EditType.CHOICE:
                    if (eruptBuildModel.eruptModel.mode === "search") {
                        ef.eruptFieldJson.edit.choiceType.vl.forEach(v => {
                            v.$viewValue = false;
                        });
                    }
                    break;
                case EditType.BOOLEAN:
                    if (eruptBuildModel.eruptModel.mode !== "search") {
                        ef.eruptFieldJson.edit.$value = ef.eruptFieldJson.edit.boolType.defaultValue;
                    }
                    break;
                case EditType.INPUT:
                    ef.eruptFieldJson.edit.inputType.prefixValue = null;
                    ef.eruptFieldJson.edit.inputType.suffixValue = null;
                    break;
                case EditType.TAB_TABLE_REFER:
                case EditType.TAB_TABLE_ADD:
                    ef.eruptFieldJson.edit.$value = [];
                    break;
            }
        });
        for (let key in eruptBuildModel.combineErupts) {
            this.emptyEruptValue({
                eruptModel: eruptBuildModel.combineErupts[key]
            });
        }
    }


}