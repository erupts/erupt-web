import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { LazyService } from "@delon/util";
import { DataService } from "../../service/data.service";
import { EruptFieldModel } from "../../model/erupt-field.model";
import { EruptModel } from "../../model/erupt.model";
import { WindowModel } from "../../window.model";

declare const DecoupledEditor;

@Component({
  selector: "ckeditor",
  templateUrl: "./ckeditor.component.html",
  styles: []
})
export class CkeditorComponent implements OnInit {


  @Input() private eruptField: EruptFieldModel;

  @Input() private erupt: EruptModel;

  @Input() value;

  @Output() valueChange = new EventEmitter();

  public loading: boolean;

  constructor(private lazy: LazyService, private ref: ElementRef, private data: DataService) {
  }

  ngOnInit() {
    console.log(this.value);
    this.loading = true;
    let that = this;
    this.lazy.loadScript("//cdn.ckeditor.com/ckeditor5/12.0.0/decoupled-document/ckeditor.js").then(() => {
      this.lazy.load(["/assets/js/ckeditor-zh-cn.js", "/assets/js/jquery.min.js"]).then(() => {
        DecoupledEditor
          .create(this.ref.nativeElement.querySelector("#editor"), {
            language: "zh-cn"
          })
          .then(editor => {
            this.loading = false;
            const toolbarContainer = this.ref.nativeElement.querySelector("#toolbar-container");
            toolbarContainer.appendChild(editor.ui.view.toolbar.element);
            editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
              return new UploadAdapter(loader, WindowModel.domain + "/upload/" + this.erupt.eruptName + "/" + this.eruptField.fieldName);
            };
            editor.model.document.on("change:data", function() {
              that.value = editor.getData();
              that.valueChange.emit(that.value);
            });
          })
          .catch(error => {
            console.error(error);
          });
      });
    });

  }

}

class UploadAdapter {

  private loader: any;

  private url: string;

  constructor(loader, url) {
    this.loader = loader;
    this.url = url;
  }

  upload() {
    return new Promise((resolve, reject) => {
      // $.ajax({
      //   url: this.url,
      //   type: "POST",
      //   dataType: "json",
      //   header: "",
      //   success: function(data) {
      //     if (data.res) {
      //       resolve({
      //         default: data.url
      //       });
      //     } else {
      //       reject(data.msg);
      //     }
      //
      //   }
      // });
    });
  }

  abort() {
  }
}
