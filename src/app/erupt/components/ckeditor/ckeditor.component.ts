import { Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { LazyService } from "@delon/util";
import { DataService } from "../../service/data.service";
import { EruptFieldModel } from "../../model/erupt-field.model";
import { EruptModel } from "../../model/erupt.model";
import { WindowModel } from "../../model/window.model";
import { RestPath } from "../../model/erupt.enum";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";

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

  public loading: boolean = true;

  constructor(private lazy: LazyService, private ref: ElementRef,
              @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
  }

  ngOnInit() {
    let that = this;
    setTimeout(() => {
      // <script src="https://cdn.ckeditor.com/ckeditor5/12.4.0/decoupled-document/ckeditor.js"></script>
      this.lazy.loadScript("//cdn.ckeditor.com/ckeditor5/12.4.0/decoupled-document/ckeditor.js").then(() => {
        this.lazy.load(["/assets/ckeditor5-zh-cn.js"]).then(() => {
          DecoupledEditor.create(this.ref.nativeElement.querySelector("#editor"), {
            language: "zh-cn",
            ckfinder: {
              uploadUrl: RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token
            }
          }).then(editor => {
            that.loading = false;
            const toolbarContainer = this.ref.nativeElement.querySelector("#toolbar-container");
            toolbarContainer.appendChild(editor.ui.view.toolbar.element);
            if (that.value) {
              editor.setData(that.value);
            }
            editor.model.document.on("change:data", function() {
              that.valueChange.emit(editor.getData());
            });
          }).catch(error => {
            console.error(error);
          });
        });
      });
    }, 200);
  }

}