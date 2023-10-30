import {
    Component,
    DoCheck,
    Inject,
    Input,
    KeyValueDiffers,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChildren
} from "@angular/core";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {AttachmentEnum, ChoiceEnum, EditType, FormSize, HtmlEditTypeEnum, Scene} from "../../model/erupt.enum";
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
import {NzUploadFile} from "ng-zorro-antd/upload/interface";
import {DataHandlerService} from "../../service/data-handler.service";
import {ChoiceComponent} from "../choice/choice.component";

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

    @ViewChildren('choice') choices: QueryList<ChoiceComponent>;

    private showByFieldModels: EruptFieldModel[];

    eruptModel: EruptModel;

    editType = EditType;

    htmlEditorType = HtmlEditTypeEnum;

    choiceEnum = ChoiceEnum;

    attachmentEnum = AttachmentEnum;

    uploadFilesStatus: { [key: string]: boolean } = {};

    supportCopy: boolean;

    constructor(public dataService: DataService,
                private differs: KeyValueDiffers,
                private i18n: I18NService,
                private dataHandlerService: DataHandlerService,
                @Inject(DA_SERVICE_TOKEN) public tokenService: ITokenService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService) {
        this.supportCopy = "clipboard" in navigator
    }

    ngOnInit() {
        this.eruptModel = this.eruptBuildModel.eruptModel;
        let layout = this.eruptModel.eruptJson.layout;
        if (layout && layout.formSize == FormSize.FULL_LINE) {
            this.col = colRules[1];
        }
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
        if (this.choices && this.choices.length > 0) {
            for (let choice of this.choices) {
                this.dataHandlerService.eruptFieldModelChangeHook(this.eruptModel, choice.eruptField, (value) => {
                    for (let choice of this.choices) {
                        choice.dependChange(value);
                    }
                });
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


    previewImageHandler = (file: NzUploadFile) => {
        if (file.url) {
            window.open(file.url);
        } else if (file.response && file.response.data) {
            window.open(DataService.previewAttachment(file.response.data));
        }
    };

    changeTagAll($event, field: EruptFieldModel) {
        for (let vl of field.componentValue) {
            vl.$viewValue = $event;
        }
    }

    getFromData(): any {
        let result = {};
        for (let eruptFieldModel of this.eruptModel.eruptFieldModels) {
            result[eruptFieldModel.fieldName] = eruptFieldModel.eruptFieldJson.edit.$value;
        }
        return result;
    }

    copy(val) {
        if (!val) {
            val = "";
        }
        navigator.clipboard.writeText(val).then(() => {
            this.msg.success(this.i18n.fanyi("global.copy_success"))
        });
    }

    uploadAccept(accept: string[]): string[] {
        return accept.map(it => '.' + it)
    }


    iframeHeight = IframeHeight;

}
