import {Component, ElementRef, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {LazyService} from "@delon/util";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {FormsModule} from "@angular/forms";
import {NZ_MODAL_DATA} from "ng-zorro-antd/modal";
import {SharedModule} from "@shared/shared.module";
import {UEditorComponent} from "../ueditor/ueditor.component";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: 'erupt-print-template',
    imports: [
        FormsModule,
        SharedModule
    ],
    templateUrl: './print-template.html',
    styleUrl: './print-template.less'
})
export class PrintTemplate implements OnInit {

    @Input() value: string;

    @Input() height: number | string = 300;

    @Input() readonly: boolean;

    @ViewChild('ue') ue: UEditorComponent;

    public loading: boolean = true;

    templates: { name: string, content: string }[] = [];

    vars: { value: string, label: string }[] = [];

    constructor(private lazy: LazyService, private ref: ElementRef,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
                @Inject(NZ_MODAL_DATA) private data: any,
                private dataService: DataService) {
        if (data) {
            this.value = data.value;
            this.height = data.height || this.height;
            this.readonly = data.readonly || this.readonly;
            this.vars = data.vars || [];
        }
    }

    getContent(): string {
        return this.ue.Instance.getContent();
    }

    initMention(editor: any) {
        const vars = this.vars;
        if (!vars || vars.length === 0) return;
        if (editor.getContent && editor.getContent.isHijacked) return;

        // 这种方案最稳妥：拦截 setContent 和 getContent
        if (editor.setContent) {
            const originalSetContent = editor.setContent;
            editor.setContent = function (data: string, isAppendTo: boolean) {
                let processedData = data;
                vars.forEach(v => {
                    const reg = new RegExp(`\\\\{\\\\{${v.value}\\\\}\\\\}`, 'g');
                    processedData = (processedData || '').replace(reg,
                        `<span class="mention" data-variable="true" data-id="${v.value}" style="color: #1890ff;margin: 0 2px;font-weight: bold;" contenteditable="false"><span style="opacity: 0.5;">{</span>&nbsp;${v.label}&nbsp;<span style="opacity: 0.5;">}</span></span>`);
                });
                return originalSetContent.apply(this, arguments);
            };
        }

        if (editor.getContent) {
            const originalGetContent = editor.getContent;
            editor.getContent = function () {
                let data = originalGetContent.apply(this, arguments);
                if (!data || typeof data !== 'string') return data;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data;
                tempDiv.querySelectorAll('span[data-variable="true"]').forEach((el: any) => {
                    const id = el.getAttribute('data-id');
                    el.replaceWith(`{{${id}}}`);
                });
                return tempDiv.innerHTML;
            };
            editor.getContent.isHijacked = true;
        }
    }

    addVar(v: { value: string, label: string }) {
        this.ue.Instance.execCommand('inserthtml', `<span class="mention" data-variable="true" data-id="${v.value}" style="color: #1890ff;margin: 0 2px;font-weight: bold;" contenteditable="false"><span style="opacity: 0.5;">{</span>${v.label}<span style="opacity: 0.5;">}</span></span>`);
    }

    applyTemplate(content: string) {
        this.ue.Instance.setContent(content);
    }

    onPreReady(ue: UEditorComponent) {
        const UE = (window as any).UE;
        if (UE && UE.Editor) {
            this.initMention(UE.Editor.prototype);
        }
    }

    onReady(ue: UEditorComponent) {
        this.loading = false;
        // 如果 prototype 劫持失败，这里作为兜底
        if (!ue.Instance.getContent || !ue.Instance.getContent.isHijacked) {
            this.initMention(ue.Instance);
        }
        if (this.value) {
            ue.Instance.setContent(this.value);
        }
    }

    ngOnInit() {
        this.dataService.printTemplates().subscribe(res => {
            this.templates = res.data || [];
        });
        if (this.vars.length === 0) {
            this.dataService.printVars().subscribe(res => {
                if (res.data) {
                    this.vars.push(...res.data);
                }
            });
        }
    }

    protected readonly confirm = confirm;
}
