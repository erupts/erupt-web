import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {LazyService} from "@delon/util";

declare let $;
declare let editormd;

@Component({
    selector: 'erupt-markdown',
    templateUrl: './markdown.component.html',
    styles: []
})
export class MarkdownComponent implements OnInit {

    @Input() eruptField: EruptFieldModel;

    @Input() value: string;

    constructor(private lazy: LazyService) {
    }

    ngOnInit() {
        let that = this;
        this.lazy.loadStyle("assets/editor.md/css/editormd.min.css").then(() => {
            this.lazy.loadScript("assets/js/jquery.min.js").then(() => {
                this.lazy.loadScript("assets/editor.md/editormd.min.js").then(() => {
                    $(function () {
                        let editor = editormd("editor-md", {
                            width: "100%",
                            emoji: true,
                            taskList: true,
                            previewCodeHighlight: false,
                            tex: true, // 开启科学公式TeX语言支持，默认关闭
                            flowChart: true, // 开启流程图支持，默认关闭
                            sequenceDiagram: true,
                            placeholder: that.eruptField && that.eruptField.eruptFieldJson.edit.placeHolder,
                            height: that.value ? '700px' : "600px",
                            path: "assets/editor.md/",
                            pluginPath: "assets/editor.md/plugins/",
                            // imageUpload : true,
                            // imageFormats : ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
                            // imageUploadURL : "./php/upload.php",
                        });
                    });
                });
            });
        });
    }
}
