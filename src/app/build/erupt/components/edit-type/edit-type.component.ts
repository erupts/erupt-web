import {Component, DoCheck, Inject, Input, KeyValueDiffers, OnDestroy, OnInit} from "@angular/core";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {Edit, EruptFieldModel, FormCtrl} from "../../model/erupt-field.model";
import {
    AttachmentEnum,
    ChoiceEnum,
    EditType,
    FormSize,
    HtmlEditTypeEnum,
    MultiChoiceEnum,
    Scene
} from "../../model/erupt.enum";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";
import {colRules} from "@shared/model/util.model";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {IframeHeight} from "@shared/util/window.util";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {I18NService} from "@core";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzUploadFile} from "ng-zorro-antd/upload";
import {NzImageService} from "ng-zorro-antd/image";
import {DataHandlerService} from "../../service/data-handler.service";
import {BehaviorSubject, skip} from "rxjs";
import {SignaturePadComponent} from "../signature-pad/signature-pad.component";

@Component({
    standalone: false,
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

    private dynamicByFieldModels: EruptFieldModel[];

    eruptModel: EruptModel;

    editType = EditType;

    htmlEditorType = HtmlEditTypeEnum;

    choiceEnum = ChoiceEnum;

    multiChoiceEnum = MultiChoiceEnum;

    attachmentEnum = AttachmentEnum;

    uploadFilesStatus: { [key: string]: boolean } = {};

    supportCopy: boolean;

    iframeHeight = IframeHeight;

    divideCollapsed: { [key: string]: boolean } = {};

    private divideGroupMap: Map<string, string> = new Map();

    divideGroupFields: Map<string, EruptFieldModel[]> = new Map();

    divideGroupedFieldSet: Set<string> = new Set();

    tabErupts: {
        key: string,
        value: EruptBuildModel
    }[] = [];

    constructor(public dataService: DataService,
                private i18n: I18NService,
                private differs: KeyValueDiffers,
                private dataHandlerService: DataHandlerService,
                @Inject(DA_SERVICE_TOKEN) public tokenService: ITokenService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService,
                private imageService: NzImageService) {
        this.supportCopy = "clipboard" in navigator
    }

    ngOnInit() {
        this.eruptModel = this.eruptBuildModel.eruptModel;
        let layout = this.eruptModel.eruptJson.layout;
        if (layout && layout.formSize == FormSize.FULL_LINE) {
            this.col = colRules[1];
        }
        // Build divide group map
        const fieldModelMap = this.eruptModel.eruptFieldModelMap;
        let currentDivide: string = null;
        for (let model of this.eruptModel.eruptFieldModels) {
            if (model.eruptFieldJson.edit?.type === EditType.DIVIDE) {
                const fields = model.eruptFieldJson.edit.divideType?.fields;
                if (fields?.length) {
                    // Explicit field list: panel mode
                    const grouped: EruptFieldModel[] = [];
                    for (let fn of fields) {
                        const fm = fieldModelMap.get(fn);
                        if (fm) {
                            grouped.push(fm);
                            this.divideGroupMap.set(fn, model.fieldName);
                            this.divideGroupedFieldSet.add(fn);
                        }
                    }
                    this.divideGroupFields.set(model.fieldName, grouped);
                    currentDivide = null;
                } else {
                    // No fields specified: divider mode, all until next DIVIDE
                    currentDivide = model.fieldName;
                }
            } else if (currentDivide && model.eruptFieldJson.edit?.show && model.eruptFieldJson.edit?.title) {
                this.divideGroupMap.set(model.fieldName, currentDivide);
            }
        }
        for (let model of this.eruptModel.eruptFieldModels) {
            switch (model.eruptFieldJson.edit.type) {
                case EditType.TAB_TABLE_REFER:
                case EditType.TAB_TABLE_ADD:
                case EditType.TAB_TREE:
                    this.tabErupts.push({
                        key: model.fieldName,
                        value: this.eruptBuildModel.tabErupts[model.fieldName]
                    })
                    break;
            }
            model.eruptFieldJson.edit.$valueDiff = this.differs.find(model.eruptFieldJson.edit).create();
            model.eruptFieldJson.edit.$valueSubject = new BehaviorSubject<any>(null);
            let edit = model.eruptFieldJson.edit;
            if (edit.type == EditType.ATTACHMENT) {
                if (!edit.$viewValue) {
                    edit.$viewValue = [];
                }
            }
            let dynamic = model.eruptFieldJson.edit.dynamic;
            if (dynamic) {
                if (!this.dynamicByFieldModels) {
                    this.dynamicByFieldModels = [];
                }
                this.dynamicByFieldModels.push(model);
                this.dynamicByCheck(model);
            }
            if (model.eruptFieldJson.edit.onchange && model.eruptFieldJson.edit.onchange != "OnChange") {
                model.eruptFieldJson.edit.$valueSubject.pipe(skip(1)).subscribe((value) => {
                    if (!this.loading) {
                        this.dataService.onChange(this.eruptModel.eruptName, model.fieldName, this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)).subscribe(res => {
                            if (res.data.formData) {
                                for (let k of Object.keys(res.data.formData)) {
                                    let v = res.data.formData[k];
                                    let eruptFieldModel: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(k);
                                    if (eruptFieldModel) {
                                        eruptFieldModel.eruptFieldJson.edit.$value = v;
                                    }
                                }
                            }
                            if (res.data.editExpr) {
                                for (let k of Object.keys(res.data.editExpr)) {
                                    let v = res.data.editExpr[k];
                                    let eruptFieldModel: EruptFieldModel = this.eruptModel.eruptFieldModelMap.get(k);
                                    if (eruptFieldModel) {
                                        let e = eruptFieldModel.eruptFieldJson.edit;
                                        new Function("edit", v)(e);
                                    }
                                }
                            }
                        })
                    }
                })
            }
        }
    }

    isReadonly(eruptFieldModel: EruptFieldModel): boolean {
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
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            if (eruptFieldModel.eruptFieldJson.edit.$valueDiff?.diff(eruptFieldModel.eruptFieldJson.edit)) {
                eruptFieldModel.eruptFieldJson.edit.$valueSubject.next(eruptFieldModel.eruptFieldJson.edit.$value);
            }
        }
        if (this.dynamicByFieldModels) {
            for (let model of this.dynamicByFieldModels) {
                let dynamicBy = model.eruptFieldJson.edit.dynamic;
                let edit = this.eruptModel.eruptFieldModelMap.get(dynamicBy.dependField).eruptFieldJson.edit;
                if (edit.$beforeValue != edit.$value) {
                    edit.$beforeValue = edit.$value;
                    this.dynamicByFieldModels.forEach(m => {
                        this.dynamicByCheck(m);
                    });
                }
            }
        }
    }

    dynamicByCheck(model: EruptFieldModel) {
        let dynamicBy = model.eruptFieldJson.edit.dynamic;
        let value = this.eruptModel.eruptFieldModelMap.get(dynamicBy.dependField).eruptFieldJson.edit.$value;
        try {
            let match = !!new Function("value", "return " + dynamicBy.condition)(value);
            if (match) {
                this.dynamicMatch(model, dynamicBy.noMatch, false)
                this.dynamicMatch(model, dynamicBy.match, true)
            } else {
                this.dynamicMatch(model, dynamicBy.match, false)
                this.dynamicMatch(model, dynamicBy.noMatch, true)
            }
        } catch (e) {
            console.error(model.fieldName + " DynamicBy expr err: " + e)
        }

    }

    dynamicMatch(model: EruptFieldModel, formCtrl: FormCtrl, match: boolean) {
        if (match) {
            model.eruptFieldJson.edit.show = true;
        }
        switch (formCtrl) {
            case FormCtrl.SHOW:
                model.eruptFieldJson.edit.show = match
                break
            case FormCtrl.HIDE:
                model.eruptFieldJson.edit.show = !match
                break
            case FormCtrl.NOTNULL:
                model.eruptFieldJson.edit.notNull = match
                break
            case FormCtrl.READONLY:
                model.eruptFieldJson.edit.readOnly = {
                    edit: match,
                    add: match
                }
                break
        }
    }

    toggleDivideGroup(fieldName: string): void {
        this.divideCollapsed[fieldName] = !this.divideCollapsed[fieldName];
    }

    isDivideCollapsed(field: EruptFieldModel): boolean {
        if (field.eruptFieldJson.edit.type === EditType.DIVIDE) return false;
        const group = this.divideGroupMap.get(field.fieldName);
        return group ? !!this.divideCollapsed[group] : false;
    }

    private divideGroupBuildModelCache: Map<string, any> = new Map();

    getDivideGroupBuildModel(divideFieldName: string): any {
        if (this.divideGroupBuildModelCache.has(divideFieldName)) {
            return this.divideGroupBuildModelCache.get(divideFieldName);
        }
        const fields = this.divideGroupFields.get(divideFieldName);
        const model = {
            eruptModel: {
                ...this.eruptModel,
                eruptFieldModels: fields
            },
            tabErupts: null,
            combineErupts: this.eruptBuildModel.combineErupts
        };
        this.divideGroupBuildModelCache.set(divideFieldName, model);
        return model;
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
            } else if (file.response?.data) {
                file.url = DataService.previewAttachment(file.response.data);
            }
        } else if (status === "error") {
            this.uploadFilesStatus[file.uid] = true;
            this.msg.error(`${file.name} 上传失败`);
        }
    }


    previewImageHandler = (file: NzUploadFile) => {
        let url = file.url || file.thumbUrl;
        if (!url && file.response?.data) {
            url = DataService.previewAttachment(file.response.data);
        }
        if (url) {
            this.imageService.preview([{src: url, alt: file.name}]);
        }
    };

    copy(val) {
        if (!val) {
            val = "";
        }
        navigator.clipboard.writeText(val).then(() => {
            this.msg.success(this.i18n.fanyi("global.copy_success"))
        });
    }

    onAttachmentDrop(event: CdkDragDrop<any>, field: EruptFieldModel): void {
        moveItemInArray(field.eruptFieldJson.edit.$viewValue, event.previousIndex, event.currentIndex);
    }

    removeFile(file: any, field: EruptFieldModel): void {
        const list = field.eruptFieldJson.edit.$viewValue;
        const idx = list.indexOf(file);
        if (idx >= 0) list.splice(idx, 1);
    }

    uploadAccept(accept: string[]): string[] {
        if (!accept || accept.length == 0) {
            return null;
        }
        return accept.map(it => '.' + it)
    }

    //fill form fields from backend data
    fillForm(data: any) {
        for (let key in data) {
            if (this.eruptModel.eruptFieldModelMap.get(key)) {
                this.eruptModel.eruptFieldModelMap.get(key).eruptFieldJson.edit.$value = data[key];
            }
        }
    }

    clearSign(edit: Edit): void {
        edit.$value = null;
    }

    openSign(edit: Edit) {
        this.modal.create({
            nzTitle: '签名',
            nzDraggable: true,
            nzContent: SignaturePadComponent,
            nzMaskClosable: false,
            nzWidth: '50%',
            nzOkText: '保存',
            nzCancelText: '取消',
            nzOnOk: (sign: SignaturePadComponent) => {
                edit.$value = sign.getSign();
            },
            nzOnCancel: () => {

            }
        });
    }

}
