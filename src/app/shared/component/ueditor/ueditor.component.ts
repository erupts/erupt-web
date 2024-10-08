import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    forwardRef,
    Inject,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChange,
    SimpleChanges,
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {InputNumber} from '@ng-util/util/convert';
import {UEditorConfig} from './ueditor.config';
import {NuLazyService} from '@ng-util/lazy';

const isSSR = !(typeof document === 'object' && !!document);
let _hook_finished = false;

export type EventTypes =
    | 'destroy'
    | 'reset'
    | 'focus'
    | 'langReady'
    | 'beforeExecCommand'
    | 'afterExecCommand'
    | 'firstBeforeExecCommand'
    | 'beforeGetContent'
    | 'afterGetContent'
    | 'getAllHtml'
    | 'beforeSetContent'
    | 'afterSetContent'
    | 'selectionchange'
    | 'beforeSelectionChange'
    | 'afterSelectionChange';

@Component({
    selector: 'ueditor',
    template: `
        <nz-spin [nzSpinning]="loading">
            <textarea id="{{ id }}" class="ueditor-textarea"></textarea>
        </nz-spin>
    `,
    preserveWhitespaces: false,
    styles: [
        `
            :host {
                line-height: initial;
            }

            :host .ueditor-textarea {
                display: none;
            }
        `,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UEditorComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UEditorComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor {

    private cog: UEditorConfig;


    flushInterval: string | number | NodeJS.Timeout

    @Input()
    set disabled(value: boolean) {
        this._disabled = value;
        this.setDisabled();
    }

    constructor(
        private lazySrv: NuLazyService,
        @Inject(DOCUMENT) private doc: any,
        private cd: ChangeDetectorRef,
        private zone: NgZone,
    ) {
        this.cog = {
            js: [
                './assets/ueditor/ueditor.config.js',
                './assets/ueditor/ueditor.all.min.js',
            ],
            // 默认前端配置项
            options: {
                UEDITOR_HOME_URL: './assets/ueditor/'
            }
        }
    }

    /**
     * 获取UE实例
     */
    get Instance(): any {
        return this.instance;
    }

    private instance: any;
    private value!: string;
    private inited = false;
    private events: any = {};

    loading = true;
    id = `_ueditor-${Math.random().toString(36).substring(2)}`;

    @Input() config: any;
    private _disabled = false;
    @Input() @InputNumber() delay = 50;
    @Output() readonly onPreReady = new EventEmitter<UEditorComponent>();
    @Output() readonly onReady = new EventEmitter<UEditorComponent>();
    @Output() readonly onDestroy = new EventEmitter();

    private onChange: (value: string) => void = () => {
    };
    private onTouched: () => void = () => {
    };

    private _getWin(): any {
        return this.doc.defaultView || window;
    }

    ngOnInit(): void {
        this.inited = true;
    }

    ngAfterViewInit(): void {
        if (isSSR) {
            return;
        }
        // 已经存在对象无须进入懒加载模式
        if (this._getWin().UE) {
            this.initDelay();
            return;
        }

        this.lazySrv.monitor(this.cog.js).subscribe(() => this.initDelay());
        this.lazySrv.load(this.cog.js!);
    }

    ngOnChanges(changes: { [P in keyof this]?: SimpleChange } & SimpleChanges): void {
        if (this.inited && changes.config) {
            this.destroy();
            this.initDelay();
        }
    }

    private initDelay(): void {
        setTimeout(() => this.init(), this.delay);
    }

    private init(): void {
        const UE = this._getWin().UE;
        if (!UE) {
            throw new Error('uedito js文件加载失败');
        }

        if (this.instance) {
            return;
        }

        // registrer hook
        if (this.cog.hook && !_hook_finished) {
            _hook_finished = true;
            this.cog.hook(UE);
        }

        this.onPreReady.emit(this);

        const opt = {...this.cog.options, ...this.config};

        this.zone.runOutsideAngular(() => {
            const ueditor = UE.getEditor(this.id, opt);
            ueditor.ready(() => {
                this.instance = ueditor;
                if (this.value) {
                    this.instance.setContent(this.value);
                }
                this.onReady.emit(this);
                this.flushInterval = setInterval(() => {
                    if (this.value != this.instance.getContent()) {
                        this.onChange(this.instance.getContent())
                    }
                }, 1000)
            });
            ueditor.addListener('contentChange', () => {
                this.value = ueditor.getContent();
                this.zone.run(() => this.onChange(this.value));
            });
        });
        this.loading = false;
        this.cd.detectChanges();
    }

    destroy(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval)
        }
        if (this.instance) {
            this.zone.runOutsideAngular(() => {
                Object.keys(this.events).forEach((name) => this.instance.removeListener(name, this.events[name]));
                this.instance.removeListener('ready');
                this.instance.removeListener('contentChange');
                // 由于此时 Angular 已经移除 DOM，可能会引起内部无法访问产生异常
                // https://github.com/cipchk/ngx-ueditor/issues/62
                try {
                    this.instance.destroy();
                    this.instance = null;
                } catch {
                }
            });
        }
        this.onDestroy.emit();
    }

    private setDisabled(): void {
        if (!this.instance) {
            return;
        }
        if (this._disabled) {
            this.instance.setDisabled();
        } else {
            this.instance.setEnabled();
        }
    }

    /**
     * 设置编辑器语言
     */
    setLanguage(lang: 'zh-cn' | 'en'): PromiseLike<void> {
        const UE = this._getWin().UE;
        return this.lazySrv.load(`${this.cog.options!.UEDITOR_HOME_URL}/lang/${lang}/${lang}.js`).then(() => {
            this.destroy();

            // 清空语言
            if (!UE._bak_I18N) {
                UE._bak_I18N = UE.I18N;
            }
            UE.I18N = {};
            UE.I18N[lang] = UE._bak_I18N[lang];

            this.initDelay();
        });
    }

    /**
     * 添加编辑器事件
     */
    addListener(eventName: EventTypes, fn: any): void {
        if (this.events[eventName]) {
            return;
        }
        this.events[eventName] = fn;
        this.instance.addListener(eventName, fn);
    }

    /**
     * 移除编辑器事件
     */
    removeListener(eventName: EventTypes): void {
        if (!this.events[eventName]) {
            return;
        }
        this.instance.removeListener(eventName, this.events[eventName]);
        delete this.events[eventName];
    }

    ngOnDestroy(): void {
        this.destroy();
    }

    writeValue(value: string): void {
        this.value = value;
        if (this.instance) {
            this.instance.setContent(this.value);
        }
    }

    registerOnChange(fn: (_: any) => {}): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => {}): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.setDisabled();
    }
}
