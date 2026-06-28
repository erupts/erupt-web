import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NZ_MODAL_DATA} from "ng-zorro-antd/modal";
import {SharedModule} from "@shared/shared.module";
import {CkeditorComponent} from "../../../build/erupt/components/ckeditor/ckeditor.component";
import {DataService} from "@shared/service/data.service";
import {LV} from "../../../build/erupt/model/common.model";
import {deepCopy} from "@delon/util";

export interface PrintVar extends LV<string, string> {
    template?: string;
    vars?: LV<string, string>[];
}

export interface PrintPageConfig {
    paperSize: string;  // paper size
    orientation: string;  // paper orientation
    marginTop: number;  // top margin (mm)
    marginRight: number;  // right margin (mm)
    marginBottom: number;  // bottom margin (mm)
    marginLeft: number;  // left margin (mm)
}

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

    @Input() height: number = 360;

    @Input() readonly: boolean = false;

    @Input() pageConfig: PrintPageConfig;

    @Input() showTitle: boolean = false;

    @Input() configTitle: string = '';

    @ViewChild('ck') ck: CkeditorComponent;

    templates: { name: string, content: string }[] = [];

    vars: PrintVar[] = [];

    globalVars: PrintVar[] = [];

    primaryColor: string = "#1890ff";

    // paper size options
    paperSizeOptions = [
        {label: 'A4', value: 'A4'},
        {label: 'A3', value: 'A3'},
        {label: 'A5', value: 'A5'},
        {label: 'Letter', value: 'Letter'},
        {label: 'Auto', value: 'Custom'}
    ];

    // paper orientation options
    orientationOptions = [
        {label: 'print.portrait', value: 'portrait'},
        {label: 'print.landscape', value: 'landscape'}
    ];

    // configuration panel visibility state
    showPageConfig = false;

    constructor(@Inject(NZ_MODAL_DATA) private data: any,
                private dataService: DataService) {
    }

    ngOnInit() {
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--ant-primary-color');
        if (primaryColor) {
            this.primaryColor = primaryColor;
        }
        this.dataService.printTemplates().subscribe(res => {
            this.templates = res.data || [];
        });
        this.dataService.printVars().subscribe(res => {
            this.globalVars = res.data;
        });

        // initialize page configuration default values
        if (!this.pageConfig) {
            this.pageConfig = {
                paperSize: 'A4',
                orientation: 'portrait',
                marginTop: 10,
                marginRight: 10,
                marginBottom: 10,
                marginLeft: 10
            };
        }
    }

    getContent(): string {
        return this.ck.instance.getData();
    }

    getTitle(): string {
        return this.configTitle;
    }

    getPageConfig(): PrintPageConfig {
        return this.pageConfig;
    }

    togglePageConfig(): void {
        this.showPageConfig = !this.showPageConfig;
    }

    private flatVars(): PrintVar[] {
        const vars = deepCopy(this.vars);
        vars.push(...this.globalVars);
        for (let v of vars) {
            if (v.vars && v.vars.length > 0) {
                vars.push(...v.vars);
            }
        }
        return vars;
    }

    initMention(editor: any) {
        const vars = this.flatVars();
        if (!vars || vars.length === 0) return;
        if (editor.getData && editor.getData.isHijacked) return;
        const that = this;

        const originalSetData = editor.setData.bind(editor);
        editor.setData = function (data: string) {
            let processedData = data;
            vars.forEach(v => {
                const reg = new RegExp(`\\$\!\\{${v.value}\\}`, 'g');
                processedData = (processedData || '').replace(reg, that.renderVar(v));
            });
            return originalSetData(processedData);
        };

        const originalGetData = editor.getData.bind(editor);
        editor.getData = function (options?: any) {
            let data = originalGetData(options);
            if (!data || typeof data !== 'string') return data;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            tempDiv.querySelectorAll('span[data-variable="true"]').forEach((el: any) => {
                const id = el.getAttribute('data-id');
                el.replaceWith('$!' + `{${id}}`);
            });
            return tempDiv.innerHTML;
        };
        editor.getData.isHijacked = true;
    }

    addVar(v: PrintVar) {
        const editor = this.ck.instance;
        if (!editor) return;
        const html = this.renderVar(v);
        try {
            const viewFragment = editor.data.processor.toView(html);
            const modelFragment = editor.data.toModel(viewFragment);
            editor.model.insertContent(modelFragment);
        } catch {
            editor.setData(editor.getData() + html);
        }
    }

    renderVar(v: PrintVar) {
        let primaryColor = this.primaryColor;
        if (v.template) {
            let processedTemplate = v.template;
            if (v.vars && v.vars.length > 0) {
                v.vars.forEach(subVar => {
                    const reg = new RegExp(`\\$\!\\{${subVar.value}\\}`, 'g');
                    processedTemplate = processedTemplate.replace(reg, this.renderVar(subVar));
                });
            }
            return processedTemplate;
        } else {
            return `<span class="mention" data-variable="true" data-id="${v.value}" style="color: ${primaryColor};margin: 0 2px;font-weight: bold;" contenteditable="false"><span style="opacity: 0.5;">{&nbsp;</span>${v.label}<span style="opacity: 0.5;">&nbsp;}</span></span>`;
        }
    }

    applyTemplate(content: string) {
        this.ck.instance.setData(content);
    }

    onCkReady(editor: any) {
        this.initMention(editor);
        if (this.value) {
            editor.setData(this.value);
        }
    }

}
