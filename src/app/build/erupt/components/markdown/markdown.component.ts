import {
    AfterViewInit,
    Component,
    DoCheck,
    ElementRef,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
// Type-only: the runtime bundle is fetched lazily from assets, so that a form
// without a markdown field never pays for it.
import type Vditor from 'vditor';
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
export class MarkdownComponent implements OnInit, AfterViewInit, DoCheck, OnDestroy {

    @ViewChild('vditorContainer', {static: true}) private vditorContainer: ElementRef;

    @Input() eruptField: EruptFieldModel;

    @Input() erupt: EruptModel;

    @Input() readonly: boolean;

    // new config input, allows external config to override defaults
    @Input() editorConfig: any = {};

    // editor mode
    @Input() editorMode: 'wysiwyg' | 'ir' | 'sv' = 'wysiwyg';


    public loading: boolean = true;

    private editorHeight: number = 360;

    private cdnPath: string = 'assets/vditor';

    editorError: boolean = false;

    private vditor: Vditor;

    private _lastValue: any;

    private destroyed: boolean = false;

    // Default toolbar: the everyday marks stay visible, the rest folds into "more"
    // so the field does not out-shout the form around it.
    private defaultToolbar: any[] = [
        'headings',
        'bold',
        'italic',
        '|',
        'link',
        'quote',
        'code',
        '|',
        'list',
        'ordered-list',
        '|',
        'table',
        'upload',
        {
            name: 'more',
            toolbar: [
                'strike',
                'inline-code',
                'check',
                'line',
                'outdent',
                'indent',
                'emoji',
                'outline',
                'edit-mode',
                'both',
                'undo',
                'redo'
            ]
        },
        'preview',
        'fullscreen'
    ];

    constructor(
        private lazy: LazyService, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
    }

    ngOnInit() {
        this.loading = true;
    }

    ngDoCheck() {
        if (this.vditor && this.eruptField) {
            const currentValue = this.eruptField.eruptFieldJson?.edit?.$value;
            if (currentValue !== this._lastValue) {
                this._lastValue = currentValue;
                this.vditor.setValue(currentValue || '');
            }
        }
    }

    ngAfterViewInit() {
        // Script and stylesheet ride together: the css is no longer in the global
        // bundle, so it must land before the editor paints.
        Promise.all([
            this.lazy.loadScript(`${this.cdnPath}/dist/index.min.js`),
            this.lazy.loadStyle(`${this.cdnPath}/dist/index.css`)
        ]).then(() => this.waitForVditorGlobal()).then(ctor => {
            if (this.destroyed) {
                return;
            }
            this.initVditor(ctor);
        }).catch(error => {
            this.loading = false;
            this.editorError = true;
            console.error('Failed to load Vditor:', error);
        });
    }

    /**
     * The UMD bundle assigns window.Vditor as it evaluates; a cached lazy-load
     * resolves before that assignment lands, so poll briefly for the global.
     */
    private waitForVditorGlobal(): Promise<any> {
        return new Promise((resolve, reject) => {
            let tries = 0;
            const poll = () => {
                const ctor = (window as any).Vditor;
                if (ctor) {
                    resolve(ctor);
                } else if (++tries > 100) {
                    reject(new Error('Vditor global is not available'));
                } else {
                    setTimeout(poll, 20);
                }
            };
            poll();
        });
    }

    /**
     * Initialize the Vditor editor
     * Uses the merged configuration to initialize the editor
     */
    private initVditor(VditorCtor: any) {
        try {
            // check if vditorContainer exists
            if (!this.vditorContainer) {
                console.error('vditorContainer is not available');
                this.loading = false;
                this.editorError = true;
                return;
            }

            const dark = document.documentElement.classList.contains('dark');

            // get the upload URL, consistent with the original CKEditor
            const uploadUrl = RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token;
            this.vditor = new VditorCtor(this.vditorContainer.nativeElement, {
                height: this.editorHeight,
                minHeight: 180,
                mode: this.editorMode,
                cache: {
                    enable: false // disable caching to avoid conflicts between different instances
                },
                // Let the user trade form real estate for writing room instead of
                // baking one tall box into every record.
                resize: {
                    enable: true
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
                theme: dark ? 'dark' : 'classic',
                preview: {
                    theme: {
                        current: dark ? 'dark' : 'light'
                    },
                    // Pin the highlight theme: only these two ship under assets, every
                    // other highlight.js stylesheet was dropped from the payload.
                    hljs: {
                        style: dark ? 'github-dark' : 'github'
                    }
                },
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
                        const val = this.eruptField.eruptFieldJson.edit.$value || '';
                        this._lastValue = this.eruptField.eruptFieldJson.edit.$value;
                        this.vditor.setValue(val);
                    }, 100)
                },
                // Caller-supplied overrides win over every default above.
                ...this.editorConfig
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
        this.destroyed = true;
        if (this.vditor) {
            this.vditor.destroy();
        }
    }

}
