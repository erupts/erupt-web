import {EruptBuildModel} from "../model/erupt-build.model";
import {STColumn, STData} from "@delon/abc";
import {DateEnum, EditType, ViewType} from "../model/erupt.enum";
import {ViewTypeComponent} from "../components/view-type/view-type.component";
import {MarkdownComponent} from "../components/markdown/markdown.component";
import {CodeEditorComponent} from "../components/code-editor/code-editor.component";
import {DataService} from "@shared/service/data.service";
import {Inject, Injectable} from "@angular/core";
import {NzMessageService, NzModalService} from "ng-zorro-antd";


@Injectable()
export class UiBuildService {

    constructor(
        @Inject(NzModalService) private modal: NzModalService,
        @Inject(NzMessageService) private msg: NzMessageService) {
    }


    /**
     * 将view数据转换为alain table组件配置信息
     * @param eruptBuildModel ebm
     * @param lineData
     *     true   数据形式为一整行txt
     *     false  数据形式为：带有层级的json
     * @param dataConvert 是否需要数据转换,如bool转换，choice转换
     */
    viewToAlainTableConfig(eruptBuildModel: EruptBuildModel, lineData: boolean, dataConvert?: boolean): STColumn[] {
        let cols: STColumn[] = [];
        const views = eruptBuildModel.eruptModel.tableColumns;
        for (let view of views) {
            let titleWidth = view.title.length * 14 + 22;
            if (titleWidth > 280) {
                titleWidth = 280;
            }
            if (view.sortable) {
                titleWidth += 20;
            }
            if (view.desc) {
                titleWidth += 16;
            }
            let edit = view.eruptFieldModel.eruptFieldJson.edit;
            let obj: STColumn = {
                title: {
                    text: view.title,
                    optional: "   ",
                    optionalHelp: view.desc
                }
            };
            obj.show = view.show;
            if (lineData) {
                //修复表格显示子类属性时无法正确检索到属性值的缺陷
                obj.index = view.column.replace(/\./g, "_");
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
            if (dataConvert) {
                switch (view.eruptFieldModel.eruptFieldJson.edit.type) {
                    case EditType.CHOICE:
                        obj.format = (item: any) => {
                            if (item[view.column]) {
                                return view.eruptFieldModel.choiceMap.get(item[view.column] + "").label;
                            } else {
                                return "";
                            }
                        };
                        break;
                    case EditType.DATE:
                        obj.format = (item: any) => {
                            if (item[view.column]) {
                                if (view.eruptFieldModel.eruptFieldJson.edit.dateType.type == DateEnum.DATE) {
                                    return item[view.column].substr(0, 10);
                                } else {
                                    return item[view.column];
                                }
                            } else {
                                return "";
                            }
                        };
                        break;
                }
            }

            obj.width = titleWidth;
            //展示类型
            switch (view.viewType) {
                case ViewType.TEXT:
                    obj.className = "text-col";
                    obj.width = null;
                    break;
                case ViewType.NUMBER:
                    obj.className = "text-right";
                    break;
                case ViewType.DATE:
                    obj.className = "date-col";
                    obj.width = 180;
                    break;
                case ViewType.BOOLEAN:
                    obj.className = "text-center";
                    obj.type = "tag";
                    if (dataConvert) {
                        obj.tag = {
                            true: {text: edit.boolType.trueText, color: 'green'},
                            false: {text: edit.boolType.falseText, color: 'red'},
                        };
                    } else {
                        if (edit.title) {
                            obj.tag = {
                                [edit.boolType.trueText]: {text: edit.boolType.trueText, color: 'green'},
                                [edit.boolType.falseText]: {text: edit.boolType.falseText, color: 'red'},
                            };
                        } else {
                            obj.tag = {
                                true: {text: '是', color: 'green'},
                                false: {text: '否', color: 'red'},
                            };
                        }
                    }
                    break;
                case ViewType.LINK:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.click = (item) => {
                        window.open(item[view.column]);
                    };
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-link' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    break;
                case ViewType.LINK_DIALOG:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-dot-circle-o' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
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
                case ViewType.MARKDOWN:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-file-text' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "24px"},
                            nzBodyStyle: {padding: "0"},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: MarkdownComponent,
                            nzComponentParams: {
                                value: item[view.column]
                            }
                        });
                    };
                    break;
                case ViewType.CODE:
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
                            // nzStyle: {top: "60px"},
                            nzBodyStyle: {padding: 0},
                            nzMaskClosable: true,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: CodeEditorComponent,
                            nzComponentParams: {
                                height: 500,
                                readonly: true,
                                language: view.eruptFieldModel.eruptFieldJson.edit.codeEditType.language,
                                // @ts-ignore
                                edit: {
                                    $value: item[view.column]
                                }
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
                                //height="50px"
                                return `<img width="100%" class="text-center" src="${DataService.previewAttachment(img)}" />`;
                            } else {
                                let img = (<string>item[view.column]).split("|")[0];
                                //height="50px"
                                return `<img width="100%" class="text-center" src="${DataService.previewAttachment(img)}" />`;
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
                case ViewType.MOBILE_HTML:
                    obj.className = "text-center";
                    obj.type = "link";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return "<i class='fa fa-file-text' aria-hidden='true'></i>";
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-xs",
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
                case ViewType.IMAGE_BASE64:
                    obj.type = "link";
                    obj.width = "90px";
                    obj.className = "text-center p-sm";
                    obj.format = (item: any) => {
                        if (item[view.column]) {
                            return `<img width="100%" src="${item[view.column]}" />`;
                        } else {
                            return "";
                        }
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px", textAlign: 'center'},
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
                case ViewType.TAB_VIEW:
                    obj.type = "link";
                    obj.className = "text-center";
                    obj.format = (item: any) => {
                        return `<i class='fa fa-adjust' aria-hidden='true'></i>`;
                    };
                    obj.click = (item) => {
                        this.modal.create({
                            nzWrapClassName: "modal-lg",
                            nzStyle: {top: "50px"},
                            nzMaskClosable: false,
                            nzKeyboard: true,
                            nzFooter: null,
                            nzTitle: view.title,
                            nzContent: ViewTypeComponent,
                            nzComponentParams: {
                                value: item[eruptBuildModel.eruptModel.eruptJson.primaryKeyCol],
                                eruptBuildModel: eruptBuildModel,
                                view: view
                            }
                        });
                    };
                    break;
                default:
                    obj.width = null;
                    break;
            }
            //编辑类型
            switch (view.eruptFieldModel.eruptFieldJson.edit.type) {
                case EditType.DATE:
                    if (view.eruptFieldModel.eruptFieldJson.edit.dateType.type == DateEnum.DATE_TIME) {
                        obj.width = 180;
                    } else {
                        obj.width = 90;
                    }
                    break;
            }
            if (view.template) {
                obj.format = (item: any) => {
                    try {
                        let value = item[view.column];
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
            if (view.width) {
                obj.width = isNaN(Number(view.width)) ? view.width : view.width + "px";
            }
            cols.push(obj);
        }
        return cols;
    }
}
