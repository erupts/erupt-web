import {Component, DoCheck, EventEmitter, Inject, Input, KeyValueDiffers, OnDestroy, OnInit, Output} from "@angular/core";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {AttachmentEnum, ChoiceEnum, DateEnum, EditType, HtmlEditTypeEnum, Scene} from "../../model/erupt.enum";
import {DataService} from "@shared/service/data.service";
import {TreeSelectComponent} from "../tree-select/tree-select.component";
import {NzMessageService, NzModalService, UploadFile} from "ng-zorro-antd";
import {EruptModel} from "../../model/erupt.model";
import {colRules} from "@shared/model/util.model";
import {ReferenceTableComponent} from "../reference-table/reference-table.component";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {IframeHeight} from "@shared/util/window.util";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Component({
    selector: "erupt-edit-type",
    templateUrl: "./edit-type.component.html",
    styleUrls: ["./edit-type.component.less"]
})
export class EditTypeComponent implements OnInit, OnDestroy, DoCheck {

    @Input() loading: boolean = false;

    //important
    @Input() eruptBuildModel: EruptBuildModel;

    //UI
    @Input() col = colRules[3];

    //UI
    @Input() size: "large" | "small" | "default" = "large";

    //UI
    @Input() layout: "horizontal" | "vertical" = "vertical";

    //Behavior
    @Input() mode: Scene | null;

    @Input() parentEruptName: string;

    @Input() readonly: boolean = false;

    //event
    @Output() search = new EventEmitter();

    private showByFieldModels: EruptFieldModel[];

    eruptModel: EruptModel;

    editType = EditType;

    htmlEditorType = HtmlEditTypeEnum;

    choiceEnum = ChoiceEnum;

    dateEnum = DateEnum;

    attachmentEnum = AttachmentEnum;

    uploadFilesStatus: { [key: string]: boolean } = {};

    constructor(public dataService: DataService,
                private differs: KeyValueDiffers,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(DA_SERVICE_TOKEN) public tokenService: ITokenService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit() {
        this.eruptModel = this.eruptBuildModel.eruptModel;
        for (let model of this.eruptModel.eruptFieldModels) {
            let edit = model.eruptFieldJson.edit;
            if (edit.type == EditType.ATTACHMENT) {
                if (!edit.$viewValue) {
                    edit.$viewValue = [];
                }
            }
            let showBy = model.eruptFieldJson.edit.showBy;
            if (showBy) {
                if (!this.showByFieldModels) {
                    this.showByFieldModels = [];
                }
                this.showByFieldModels.push(model);
                this.showByCheck(model);
            }
        }
    }

    isReadonly(eruptFieldModel: EruptFieldModel) {
        if (this.readonly) {
            return true;
        }
        let ro = eruptFieldModel.eruptFieldJson.edit.readOnly;
        if (this.mode === Scene.ADD) {
            return ro.add;
        } else {
            return ro.edit;
        }
    }

    ngDoCheck() {
        if (this.showByFieldModels) {
            for (let model of this.showByFieldModels) {
                let showBy = model.eruptFieldJson.edit.showBy;
                let edit = this.eruptModel.eruptFieldModelMap.get(showBy.dependField).eruptFieldJson.edit;
                if (edit.$beforeValue != edit.$value) {
                    edit.$beforeValue = edit.$value;
                    this.showByFieldModels.forEach(m => {
                        this.showByCheck(m);
                    });
                }
            }
        }
    }

    showByCheck(model: EruptFieldModel) {
        let showBy = model.eruptFieldJson.edit.showBy;
        let value = this.eruptModel.eruptFieldModelMap.get(showBy.dependField).eruptFieldJson.edit.$value;
        model.eruptFieldJson.edit.show = !!eval(showBy.expr);
    }

    ngOnDestroy(): void {

    }

    eruptEditValidate(): boolean {
        for (let key in this.uploadFilesStatus) {
            if (!this.uploadFilesStatus[key]) {
                this.msg.warning("附件上传中请稍后");
                return false;
            }
        }
        return true;
    }

    enterEvent(event) {
        if (event.which === 13) {
            this.search.emit();
        }
    }

    upLoadNzChange({file, fileList}, field: EruptFieldModel) {
        const status = file.status;
        if (file.status === "uploading") {
            this.uploadFilesStatus[file.uid] = false;
        }
        if (status === "done") {
            this.uploadFilesStatus[file.uid] = true;
            if ((<EruptApiModel>file.response).status === Status.ERROR) {
                this.modal.error({
                    nzTitle: "ERROR",
                    nzContent: file.response.message
                });
                field.eruptFieldJson.edit.$viewValue.pop();
            }
        } else if (status === "error") {
            this.uploadFilesStatus[file.uid] = true;
            this.msg.error(`${file.name} 上传失败`);
        }
    }


    previewImageHandler = (file: UploadFile) => {
        if (file.url) {
            window.open(file.url);
        } else if (file.response && file.response.data) {
            window.open(DataService.previewAttachment(file.response.data));
        }
    };


    createRefTreeModal(field: EruptFieldModel) {
        let depend = field.eruptFieldJson.edit.referenceTreeType.dependField;
        let dependVal = null;
        if (depend) {
            const dependField: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(depend);
            if (dependField.eruptFieldJson.edit.$value) {
                dependVal = dependField.eruptFieldJson.edit.$value;
            } else {
                this.msg.warning("请先选择" + dependField.eruptFieldJson.edit.title);
                return;
            }
        }
        this.modal.create({
            nzWrapClassName: "modal-xs",
            nzKeyboard: true,
            nzStyle: {top: "30px"},
            nzTitle: field.eruptFieldJson.edit.title,
            nzCancelText: "取消（ESC）",
            nzContent: TreeSelectComponent,
            nzComponentParams: {
                parentEruptName: this.parentEruptName,
                eruptModel: this.eruptModel,
                eruptField: field,
                dependVal: dependVal
            }, nzOnOk: () => {
                const tempVal = field.eruptFieldJson.edit.$tempValue;
                if (!tempVal) {
                    this.msg.warning("请选中一条数据");
                    return false;
                }
                if (tempVal.id != field.eruptFieldJson.edit.$value) {
                    this.clearReferValue(field);
                }
                field.eruptFieldJson.edit.$viewValue = tempVal.label;
                field.eruptFieldJson.edit.$value = tempVal.id;
                field.eruptFieldJson.edit.$tempValue = null;
            }
        });
    }

    createRefTableModal(field: EruptFieldModel) {
        let edit = field.eruptFieldJson.edit;
        let dependVal: string;
        if (edit.referenceTableType.dependField) {
            const dependField: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(edit.referenceTableType.dependField);
            if (dependField.eruptFieldJson.edit.$value) {
                dependVal = dependField.eruptFieldJson.edit.$value;
            } else {
                this.msg.warning("请先选择" + dependField.eruptFieldJson.edit.title);
                return;
            }
        }
        let model = this.modal.create({
            nzWrapClassName: "modal-xxl",
            nzKeyboard: true,
            nzStyle: {top: "24px"},
            nzBodyStyle: {padding: "16px"},
            nzTitle: edit.title,
            nzCancelText: "取消（ESC）",
            nzContent: ReferenceTableComponent,
            nzComponentParams: {
                eruptBuild: this.eruptBuildModel,
                eruptField: field,
                parentEruptName: this.parentEruptName,
                dependVal: dependVal
            }, nzOnOk: () => {
                let radioValue = edit.$tempValue;
                if (!radioValue) {
                    this.msg.warning("请选中一条数据");
                    return false;
                }
                if (radioValue[edit.referenceTableType.id] != field.eruptFieldJson.edit.$value) {
                    this.clearReferValue(field);
                }
                edit.$value = radioValue[edit.referenceTableType.id];
                edit.$viewValue = radioValue[edit.referenceTableType.label
                    .replace(".", "_")] || '-----';
                edit.$tempValue = radioValue;
            }
        });
    }

    clearReferValue(field: EruptFieldModel) {
        field.eruptFieldJson.edit.$value = null;
        field.eruptFieldJson.edit.$viewValue = null;
        field.eruptFieldJson.edit.$tempValue = null;
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            let edit = eruptFieldModel.eruptFieldJson.edit;
            if (edit.type == EditType.REFERENCE_TREE) {
                if (edit.referenceTreeType.dependField == field.fieldName) {
                    this.clearReferValue(eruptFieldModel);
                }
            }
            if (edit.type == EditType.REFERENCE_TABLE) {
                if (edit.referenceTableType.dependField == field.fieldName) {
                    this.clearReferValue(eruptFieldModel);
                }
            }
        }
    }


    changeTagAll($event, field: EruptFieldModel) {
        for (let vl of field.choiceList) {
            vl.$viewValue = $event;
        }
    }


    onAutoCompleteInput(event, fieldModel: EruptFieldModel) {
        let edit = fieldModel.eruptFieldJson.edit;
        if (edit.$value && edit.autoCompleteType.triggerLength <= edit.$value.toString().trim().length) {
            this.dataService.findAutoCompleteValue(this.eruptModel.eruptName, fieldModel.fieldName, edit.$value, this.parentEruptName).subscribe(res => {
                edit.autoCompleteType.items = res;
            });
        } else {
            edit.autoCompleteType.items = [];
        }
    }

    iframeHeight = IframeHeight;

}
