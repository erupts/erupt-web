import { Component, Inject, Input, OnInit } from "@angular/core";
import { DataService } from "../../service/data.service";
import { EruptModel } from "../../model/erupt.model";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { EruptApiModel, Status } from "../../model/erupt-api.model";

@Component({
  selector: "app-excel-import",
  templateUrl: "./excel-import.component.html",
  styles: []
})
export class ExcelImportComponent implements OnInit {

  @Input() eruptModel: EruptModel;

  ds = DataService;

  constructor(public dataService: DataService,
              @Inject(NzModalService)
              private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  ngOnInit() {
  }


  upLoadNzChange({ file, fileList }) {
    const status = file.status;
    if (status === "done") {
      if ((<EruptApiModel>file.response).status == Status.ERROR) {
        this.modal.error({
          nzTitle: "ERROR",
          nzContent: file.response.message
        });
      }
    } else if (status === "error") {
      this.msg.error(`${file.name} 上传失败`);
    }
  }

}
