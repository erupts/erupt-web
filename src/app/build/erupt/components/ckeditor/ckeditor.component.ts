import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output} from "@angular/core";
import {LazyService} from "@delon/util";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

declare const DecoupledDocumentEditor;

@Component({
    selector: "ckeditor",
    templateUrl: "./ckeditor.component.html",
    styles: []
})
export class CkeditorComponent implements OnInit {

    @Input() eruptField: EruptFieldModel;

    @Input() erupt: EruptModel;

    @Input() value;

    @Input() readonly: boolean;

    @Output() valueChange = new EventEmitter();

    public loading: boolean = true;

    editorError: boolean = false;

    constructor(private lazy: LazyService, private ref: ElementRef,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    ngOnInit() {
        let that = this;
        setTimeout(() => {
            this.lazy.loadScript("assets/js/ckeditor.js").then(() => {
                DecoupledDocumentEditor.create(this.ref.nativeElement.querySelector("#editor"), {
                    toolbar: {
                        items: [
                            'heading',
                            '|',
                            'fontSize',
                            'fontFamily',
                            'fontBackgroundColor',
                            'fontColor',
                            '|',
                            'bold',
                            'italic',
                            'underline',
                            'strikethrough',
                            '|',
                            'alignment',
                            '|',
                            'numberedList',
                            'bulletedList',
                            '|',
                            'indent',
                            'outdent',
                            '|',
                            'link',
                            'imageUpload',
                            'insertTable',
                            'codeBlock',
                            'blockQuote',
                            'highlight',
                            '|',
                            'undo',
                            'redo',
                            '|',
                            'code',
                            'horizontalLine',
                            'subscript',
                            'todoList',
                            'mediaEmbed'
                        ]
                    },
                    image: {
                        toolbar: [
                            'imageTextAlternative',
                            'imageStyle:full',
                            'imageStyle:side'
                        ]
                    },
                    table: {
                        contentToolbar: [
                            'tableColumn',
                            'tableRow',
                            'mergeTableCells'
                        ]
                    },
                    licenseKey: '',
                    language: "zh-cn",
                    ckfinder: {
                        uploadUrl: RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                            this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token
                    },
                    // mediaEmbed: {
                    //     providers: [
                    //         {
                    //             name: 'myprovider',
                    //             url: [
                    //                 /^lizzy.*\.com.*\/media\/(\w+)/,
                    //                 /^www\.lizzy.*/,
                    //                 /^.*/
                    //             ],
                    //             html: match => {
                    //                 //获取媒体url
                    //                 const input = match['input'];
                    //                 //console.log('input' + match['input']);
                    //                 return (
                    //                     '<div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 70%;">' +
                    //                     `<iframe src="${input}" ` +
                    //                     'style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" ' +
                    //                     'frameborder="0" allowtransparency="true" allow="encrypted-media">' +
                    //                     '</iframe>' +
                    //                     '</div>'
                    //                 );
                    //             }
                    //         }
                    //     ]
                    // }
                }).then(editor => {
                    editor.isReadOnly = this.readonly;
                    that.loading = false;
                    const toolbarContainer = this.ref.nativeElement.querySelector("#toolbar-container");
                    toolbarContainer.appendChild(editor.ui.view.toolbar.element);
                    if (that.value) {
                        editor.setData(that.value);
                    }
                    editor.model.document.on("change:data", function () {
                        that.valueChange.emit(editor.getData());
                    });
                }).catch(error => {
                    this.loading = false;
                    this.editorError = true;
                    console.error(error);
                });
            });
        }, 200);
    }

}
