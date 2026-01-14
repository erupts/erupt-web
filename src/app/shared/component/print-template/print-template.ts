import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {LazyService} from "@delon/util";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzAutosizeDirective, NzInputDirective} from "ng-zorro-antd/input";
import {FormsModule} from "@angular/forms";
import {NZ_MODAL_DATA} from "ng-zorro-antd/modal";
import {NzDropDownModule} from "ng-zorro-antd/dropdown";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";

declare const DecoupledDocumentEditor;

@Component({
    selector: 'app-print-template',
    imports: [
        NzSpinComponent,
        NzInputDirective,
        NzAutosizeDirective,
        FormsModule,
        NzDropDownModule,
        NzButtonComponent,
        NzIconDirective
    ],
    templateUrl: './print-template.html',
    styleUrl: './print-template.less'
})
export class PrintTemplate implements OnInit {

    @Input() value: string;

    @Output() valueChange = new EventEmitter();

    @Input() height: number | string = 300;

    @Input() readonly: boolean;

    public loading: boolean = true;

    editorError: boolean = false;

    vars: { value: string, label: string }[];

    editor: any;

    constructor(private lazy: LazyService, private ref: ElementRef,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
                @Inject(NZ_MODAL_DATA) private data: any) {
        if (data) {
            this.value = data.value;
            this.height = data.height || this.height;
            this.readonly = data.readonly || this.readonly;
            this.vars = data.vars || [];
        }
    }

    initMention(editor: any) {
        const vars = this.vars;
        if (!vars || vars.length === 0) return;

        // 这种方案最稳妥：拦截 setData 和 getData
        const originalSetData = editor.setData.bind(editor);
        editor.setData = (data) => {
            let processedData = data;
            vars.forEach(v => {
                const reg = new RegExp(`\\{\\{${v.value}\\}\\}`, 'g');
                processedData = processedData.replace(reg,
                    `<span class="mention" data-variable="true" data-id="${v.value}" style="color: #1890ff;margin: 0 2px;font-weight: bold;">
                       <span style=" opacity: 0.5;">{</span>
                            ${v.label}
                       <span style="opacity: 0.5;">}</span>
                    </span>`);
            });
            originalSetData(processedData);
        };

        const originalGetData = editor.getData.bind(editor);
        editor.getData = () => {
            let data = originalGetData();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            tempDiv.querySelectorAll('span[data-variable="true"]').forEach((el: any) => {
                const id = el.getAttribute('data-id');
                el.replaceWith(`{{${id}}}`);
            });
            return tempDiv.innerHTML;
        };
    }

    addVar(v: { value: string, label: string }) {
        this.editor.model.change(writer => {
            const insertText = `{{${v.value}}}`;
            this.editor.model.insertContent(writer.createText(insertText));
        });
    }

    onValueChange(data: string) {
        this.value = data;
        this.valueChange.emit(data);
        if (this.data && this.data.valueChange) {
            this.data.valueChange(data);
        }
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
                        // uploadUrl: RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                        //     this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token
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
                    this.editor = editor;
                    editor.isReadOnly = this.readonly;
                    that.loading = false;
                    const toolbarContainer = this.ref.nativeElement.querySelector("#toolbar-container");
                    toolbarContainer.appendChild(editor.ui.view.toolbar.element);
                    if (this.vars && this.vars.length > 0) {
                        this.initMention(editor);
                    }
                    if (that.value) {
                        editor.setData(that.value);
                    }
                    editor.model.document.on("change:data", function () {
                        that.onValueChange(editor.getData());
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
