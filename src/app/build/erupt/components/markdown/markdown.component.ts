import { Component, ElementRef, EventEmitter, Inject, Input, OnInit, AfterViewInit, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import Vditor from 'vditor';
import { EruptFieldModel } from "../../model/erupt-field.model";
import { EruptModel } from "../../model/erupt.model";
import { RestPath } from "../../model/erupt.enum";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";
import { LazyService } from "@delon/util";

@Component({
    selector: 'erupt-markdown',
    templateUrl: './markdown.component.html',
    styleUrls: ['./markdown.component.css']
})
export class MarkdownComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild('vditorContainer', { static: true }) private vditorContainer: ElementRef;
    
    @Input() eruptField: EruptFieldModel;
    @Input() erupt: EruptModel;
    @Input() value;
    @Input() readonly: boolean;
    
    // 新增配置项输入，允许外部传入配置覆盖默认配置
    @Input() editorConfig: any;
    // 新增编辑器高度配置
    @Input() editorHeight: number = 480;
    // 新增编辑器模式配置
    @Input() editorMode: 'wysiwyg' | 'ir' | 'sv' = 'wysiwyg';
    // 新增CDN路径配置
    @Input() cdnPath: string = 'assets/vditor/cdn';
    
    @Output() valueChange = new EventEmitter();
  
    public loading: boolean = true;
    editorError: boolean = false;
    
    private vditor: Vditor;
    private isInitialized: boolean = false;
    // 标志位，用于标记是否是由 input 事件触发的更新
    private isUpdatingFromInput: boolean = false;
    
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
        'help',
    ];
  
    constructor(
      private lazy: LazyService, private ref: ElementRef,
      @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {}
  
    ngOnInit() {
      this.loading = true;
    }
  
    ngOnChanges(changes: SimpleChanges) {
      // 当 value 变化且 vditor 已初始化时，使用 setValue 更新内容
      if (changes['value'] && !changes['value'].firstChange && this.vditor && this.isInitialized) {
        // 如果是由 input 事件触发的更新，则不重新设置编辑器的值
        if (this.isUpdatingFromInput) {
          this.isUpdatingFromInput = false;
          return;
        }
        
        // 添加延时确保 DOM 已更新
        setTimeout(() => {
          this.vditor.setValue(changes['value'].currentValue || '');
        }, 50);
      }
    }
  
    ngAfterViewInit() {
      // 延迟初始化，确保 DOM 已渲染
      setTimeout(() => {
        // 确保Vditor脚本已加载
        this.load_vditor_script();
      }, 100);
    }
    
    /**
     * 加载Vditor脚本
     * 将脚本加载逻辑抽离为单独方法，便于维护
     */
    private load_vditor_script() {
        this.lazy.loadScript(`${this.cdnPath}/dist/index.min.js`).then(() => {
          this.initVditor();
        }).catch(error => {
          this.loading = false;
          this.editorError = true;
          console.error('加载Vditor脚本失败:', error);
        });
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
        const uploadUrl = this.get_upload_url();
        
        // 创建默认配置
        const defaultConfig = {
          height: this.editorHeight,
          minHeight: 60,
          mode: this.editorMode,
          value: this.value || '',
          cache: {
            enable: false // 禁用缓存，避免不同实例间的缓存冲突
          },
          upload: {
            url: uploadUrl,
            fieldName: 'upload',
            filename: this.format_filename,
            success: this.handle_upload_success.bind(this),
            error: () => {
              console.error('上传图片失败');
            }
          },
          input: (value) => {
            // 设置标志位，表示当前更新是由 input 事件触发的
            this.isUpdatingFromInput = true;
            this.valueChange.emit(value);
          },
          theme: 'classic',
          lang: 'zh_CN',
          cdn: this.cdnPath,
          fullscreen: {
            index: 90,
          },
          toolbar: this.defaultToolbar,
          after: () => {
            this.loading = false;
            this.isInitialized = true;
            if (this.readonly) {
              this.vditor.disabled();
            }
          }
        };
        
        // 合并用户配置和默认配置
        const mergedConfig = { ...defaultConfig, ...this.editorConfig };
  
        // 直接使用ViewChild获取的DOM元素
        this.vditor = new Vditor(this.vditorContainer.nativeElement, mergedConfig);
      } catch (error) {
        this.loading = false;
        this.editorError = true;
        console.error('初始化Vditor失败:', error);
      }
    }
    
    /**
     * 获取上传URL
     * 将上传URL逻辑抽离为单独方法
     * @returns 上传URL字符串
     */
    private get_upload_url(): string {
        // console.log('打印日志查看erupt组件信息')
        // console.log(this)
        // console.log(this.erupt)
        // console.log(this.eruptField)
        // console.log(this.eruptField.fieldName)
        // console.log(this.erupt.eruptName)
        // console.log(RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
        //   this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token)


        return this.erupt && this.eruptField ? 
          RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
          this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token
          : '/api/upload/image';
    }
    
    /**
     * 格式化文件名
     * 将文件名格式化逻辑抽离为单独方法
     * @param name 原始文件名
     * @returns 格式化后的文件名
     */
    private format_filename(name: string): string {
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
    private handle_upload_success(_, res) {
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
        try {
          this.vditor.destroy();
        } catch (error) {
          console.error('销毁Vditor实例失败:', error);
        }
      }
    }
  }
