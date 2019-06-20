import { AfterViewInit, Component, Input, OnInit } from "@angular/core";
import { View } from "../model/erupt-field.model";
import { EditType, ViewType } from "../model/erupt.enum";
import { DataService } from "../service/data.service";

@Component({
  selector: "erupt-view-type",
  templateUrl: "./view-type.component.html",
  styleUrls: ["./view-type.component.less"],
  styles: []
})
export class ViewTypeComponent implements OnInit, AfterViewInit {

  @Input() view: View;

  @Input() value: any;

  @Input() eruptName: string;

  show: boolean = false;

  paths: string[];

  viewType = ViewType;

  constructor() {
  }

  ngOnInit() {
    if (this.value) {
      if (this.view.eruptFieldModel.eruptFieldJson.edit.type == EditType.ATTACHMENT) {
        const attachmentType = this.view.eruptFieldModel.eruptFieldJson.edit.attachmentType;
        if (attachmentType.maxLimit > 1) {
          this.paths = [];
          let _paths = (<string>this.value).split(attachmentType.fileSeparator);
          for (let path of _paths) {
            this.paths.push(DataService.previewAttachment(path));
          }
        } else {
          this.paths = [DataService.previewAttachment(this.value)];
        }
      }
      switch (this.view.viewType) {
        case ViewType.PDF:
          this.value = [DataService.previewAttachment(this.value)];
          break;
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.show = true;
    }, 200);
  }

}
