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

    // 新增配置项输入，允许外部传入配置覆盖默认配置
    @Input() editorConfig: any = {};

    // 编辑器模式
    @Input() editorMode: 'wysiwyg' | 'ir' | 'sv' = 'wysiwyg';


    public loading: boolean = true;

    private editorHeight: number = 480;

    private cdnPath: string = 'assets/vditor';

    editorError: boolean = false;

    private vditor: Vditor;

    // 默认工具栏配置
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
        // 延迟初始化，确保 DOM 已渲染
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
     * 初始化Vditor编辑器
     * 使用合并后的配置初始化编辑器
     */
    private initVditor() {
        try {
            // 检查 vditorContainer 是否存在
            if (!this.vditorContainer) {
                console.error('vditorContainer is undefined');
                this.loading = false;
                this.editorError = true;
                return;
            }

            // 获取上传URL，与原CKEditor保持一致
            const uploadUrl = RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token;
            ;
            this.vditor = new Vditor(this.vditorContainer.nativeElement, {
                height: this.editorHeight,
                minHeight: 60,
                mode: this.editorMode,
                cache: {
                    enable: false // 禁用缓存，避免不同实例间的缓存冲突
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
     * 格式化文件名
     * 将文件名格式化逻辑抽离为单独方法
     * @param name 原始文件名
     * @returns 格式化后的文件名
     */
    private formatFilename(name: string): string {
        return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
            .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
            .replace('/\\s/g', '');
    }

    /**
     * 处理上传成功回调
     * 将上传成功处理逻辑抽离为单独方法
     * @param _ 未使用参数
     * @param res 上传响应数据
     */
    private handleUploadSuccess(_, res) {
        try {
            // 解析响应数据
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
                // 获取文件名
                const fileName = response.fileName || '图片';
                // 使用 insertValue 方法插入图片
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
