import { Component, Inject, Input, OnInit } from "@angular/core";
import { DataService } from "../../service/data.service";
import { EruptModel } from "../../model/erupt.model";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";

@Component({
  selector: "app-excel-import",
  templateUrl: "./excel-import.component.html",
  styles: []
})
export class ExcelImportComponent implements OnInit {

  @Input() eruptModel: EruptModel;

  ds = DataService;

  constructor(public dataService: DataService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  ngOnInit() {
  }


  upLoadNzChange({ file, fileList }) {
    const status = file.status;
    if (status === "done") {
      console.log(file);
    } else if (status === "error") {
      // this.msg.error(`${file.name} 上传失败`);
    }
  }

}
