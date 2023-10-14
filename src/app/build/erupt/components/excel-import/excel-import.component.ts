import {Component, Inject, Input, OnInit} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {DrillInput, EruptModel} from "../../model/erupt.model";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {EruptApiModel, Status} from "../../model/erupt-api.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzUploadChangeParam} from "ng-zorro-antd/upload/interface";

@Component({
    selector: "app-excel-import",
    templateUrl: "./excel-import.component.html",
    styles: []
})
export class ExcelImportComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() drillInput: DrillInput;

    upload: boolean = false;

    fileList = [];

    errorText: string;

    header: object;

    constructor(public dataService: DataService,
                @Inject(NzModalService)
                private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService,
                @Inject(DA_SERVICE_TOKEN) public tokenService: TokenService) {

    }

    ngOnInit() {
        this.header = {
            token: this.tokenService.get().token,
            erupt: this.eruptModel.eruptName
        }
        if (this.drillInput) {
            Object.assign(this.header, DataService.drillToHeader(this.drillInput))
        }
    }


    upLoadNzChange(param: NzUploadChangeParam) {
        const file = param.file;
        this.errorText = null;
        if (file.status === "done") {
            if ((<EruptApiModel>file.response).status == Status.ERROR) {
                this.errorText = file.response.message;
                this.fileList = [];
            } else {
                this.upload = true;
                this.msg.success("导入成功");
            }
        } else if (file.status === "error") {
            this.errorText = file.error.error.message;
            this.fileList = [];
        }
    }

}
