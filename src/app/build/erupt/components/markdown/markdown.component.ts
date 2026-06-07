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
                console.error('加载Vditor脚本失败:', error);
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
                console.error('vditorContainer is undefined');
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
                        console.error('上传图片失败');
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
            console.error('初始化Vditor失败:', error);
        }
    }

    /**
     * Format a filename
     * Extracts filename formatting logic into a separate method
     * @param name original filename
     * @returns formatted filename
     */
    private formatFilename(name: string): string {
        return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
            .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
            .replace('/\\s/g', '');
    }

    /**
     * Handle upload success callback
     * Extracts upload success handling logic into a separate method
     * @param _ unused parameter
     * @param res upload response data
     */
    private handleUploadSuccess(_, res) {
        try {
            // parse the response data
            const response = JSON.parse(res);
            console.log('上传成功回调:', response);

            let imageUrl = '';

            if (response.data) {
                imageUrl = response.data;
            } else {
                console.warn('未能识别的上传响应格式:', response);
                return;
            }

            if (imageUrl) {
                // get the filename
                const fileName = response.fileName || '图片';
                // use insertValue to insert the image
                this.vditor.insertValue(`![${fileName}](${imageUrl})`);
            }
        } catch (e) {
            console.error('处理上传响应失败', e);
        }
    }

    ngOnDestroy() {
        if (this.vditor) {
            this.vditor.destroy();
        }
    }

}
