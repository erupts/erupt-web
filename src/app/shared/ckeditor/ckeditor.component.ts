import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { LazyService } from "@delon/util";

declare var ClassicEditor;

@Component({
  selector: "app-ckeditor",
  template: `<textarea name="ck" #ck></textarea>`,
  styles: []
})
export class CKEditorComponent implements OnInit, AfterViewInit {

  @ViewChild("ck")
  private ck: ElementRef;

  constructor(private lazy: LazyService, private ref: ElementRef) {
  }

  ngOnInit() {
    console.log(this.ref.nativeElement.querySelector("textarea"));
  }

  ngAfterViewInit() {
    this.lazy.load(["/assets/js/zh-cn.js", "/assets/js/ckeditor.js"]).then((result) => {
      console.log(result);
      ClassicEditor.create(this.ck.nativeElement).then(editor => {
        console.log(editor);
      });
    });
  }

}
