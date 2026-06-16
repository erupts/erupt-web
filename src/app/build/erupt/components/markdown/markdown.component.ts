import {AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import Vditor from 'vditor';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {LazyService} from "@delon/util";

@Component({
    standalone: false,
    selector: 'erupt-markdown',
    templateUrl: './markdown.component.html',
    styleUrls: ['./markdown.component.less']
})
export class MarkdownComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('vditorContainer', {static: true}) private vditorContainer: ElementRef;

    @Input() eruptField: EruptFieldModel;

    @Input() erupt: EruptModel;

    @Input() readonly: boolean;

    // new config input, allows external config to override defaults
    @Input() editorConfig: any = {};

    // editor mode
    @Input() editorMode: 'wysiwyg' | 'ir' | 'sv' = 'wysiwyg';


    public loading: boolean = true;

    private editorHeight: number = 480;

    private cdnPath: string = 'assets/vditor';

    editorError: boolean = false;

    private vditor: Vditor;

    // default toolbar configuration
    private defaultToolbar = [
        'emoji',
        'headings',
        'bold',
        'italic',
        'strike',
        'link',
        '|',
        'list',
        'ordered-list',
        'check',
        'outdent',
        'indent',
        '|',
        'quote',
        'line',
        'code',
        'inline-code',
        '|',
        'upload',
        'table',
        '|',
        'undo',
        'redo',
        '|',
        'fullscreen',
        'edit-mode',
        'both',
        'preview',
        'outline',
    ];

    constructor(
        private lazy: LazyService, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
    }

    ngOnInit() {
        this.loading = true;
    }

    ngAfterViewInit() {
        // delay initialization to ensure the DOM has rendered
        setTimeout(() => {
            this.lazy.loadScript(`${this.cdnPath}/dist/index.min.js`).then(() => {
                this.initVditor();
            }).catch(error => {
                this.loading = false;
                this.editorError = true;
                console.error('Failed to load Vditor script:', error);
            });
        }, 100);
    }

    /**
     * Initialize the Vditor editor
     * Uses the merged configuration to initialize the editor
     */
    private initVditor() {
        try {
            // check if vditorContainer exists
            if (!this.vditorContainer) {
                console.error('vditorContainer is not available');
                this.loading = false;
                this.editorError = true;
                return;
            }

            // get the upload URL, consistent with the original CKEditor
            const uploadUrl = RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token;
            ;
            this.vditor = new Vditor(this.vditorContainer.nativeElement, {
                height: this.editorHeight,
                minHeight: 60,
                mode: this.editorMode,
                cache: {
                    enable: false // disable caching to avoid conflicts between different instances
                },
                upload: {
                    url: uploadUrl,
                    fieldName: 'upload',
                    filename: this.formatFilename,
                    success: this.handleUploadSuccess.bind(this),
                    error: () => {
                        console.error('Image upload failed');
                    }
                },
                input: (value) => {
                    this.eruptField.eruptFieldJson.edit.$value = value;
                },
                theme: 'classic',
                lang: 'zh_CN',
                fullscreen: {
                    index: 9999,
                },
                cdn: this.cdnPath,
                toolbar: this.defaultToolbar,
                after: () => {
                    this.loading = false;
                    if (this.readonly) {
                        this.vditor.disabled();
                    }
                    setTimeout(() => {
                        this.vditor.setValue(this.eruptField.eruptFieldJson.edit.$value || '');
                    }, 100)
                }
            });
        } catch (error) {
            this.loading = false;
            this.editorError = true;
            console.error('Failed to initialize Vditor:', error);
        }
    }

    private formatFilename(name: string): string {
        return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
            .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
            .replace('/\\s/g', '');
    }

    private handleUploadSuccess(_, res) {
        try {
            const response = JSON.parse(res);
            let imageUrl = '';

            if (response.data) {
                imageUrl = response.data;
            } else {
                console.warn('Unrecognized upload response format:', response);
                return;
            }

            if (imageUrl) {
                const fileName = response.fileName || 'image';
                this.vditor.insertValue(`![${fileName}](${imageUrl})`);
            }
        } catch (e) {
            console.error('Failed to handle upload response', e);
        }
    }

    ngOnDestroy() {
        if (this.vditor) {
            this.vditor.destroy();
        }
    }

}
