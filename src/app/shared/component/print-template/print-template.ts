import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NZ_MODAL_DATA} from "ng-zorro-antd/modal";
import {SharedModule} from "@shared/shared.module";
import {CkeditorComponent} from "../../../build/erupt/components/ckeditor/ckeditor.component";
import {DataService} from "@shared/service/data.service";
import {LV} from "../../../build/erupt/model/common.model";
import {deepCopy} from "@delon/util";
import {EruptBuildModel} from "../../../build/erupt/model/erupt-build.model";
import {EruptFieldModel} from "../../../build/erupt/model/erupt-field.model";
import {EditType} from "../../../build/erupt/model/erupt.enum";

export interface PrintVar extends LV<string, string> {
    template?: string;
    vars?: LV<string, string>[];
}

// Edit types whose backend data map value is not printable as text
const NOT_PRINTABLE_TYPES: EditType[] = [
    EditType.TAB_TREE, EditType.CHECKBOX, EditType.DIVIDE, EditType.EMPTY,
    EditType.TPL, EditType.CALLOUT, EditType.GROUP, EditType.PASSWORD
];

const CONTAINER_TYPES: EditType[] = [
    EditType.TAB_TABLE_ADD, EditType.TAB_TABLE_REFER, EditType.COMBINE
];

const TH_STYLE = 'border: 1px solid #d9d9d9;padding: 8px;background: #f5f5f5;font-weight: 600;';
const TD_STYLE = 'border: 1px solid #d9d9d9;padding: 8px;';

// Velocity expression for a field value, honoring how EruptUtil.generateEruptDataMap
// shapes each edit type (reference values are maps keyed by their label field)
function fieldExpr(path: string, field: EruptFieldModel): string {
    const edit = field.eruptFieldJson.edit;
    let label: string;
    if (edit.type === EditType.REFERENCE_TREE) {
        label = edit.referenceTreeType.label;
    } else if (edit.type === EditType.REFERENCE_TABLE) {
        label = edit.referenceTableType.label;
    } else {
        return path;
    }
    return label.includes('.') ? `${path}.get("${label}")` : `${path}.${label}`;
}

function isColumnField(field: EruptFieldModel): boolean {
    const edit = field.eruptFieldJson.edit;
    return !!edit.title && !NOT_PRINTABLE_TYPES.includes(edit.type) && !CONTAINER_TYPES.includes(edit.type);
}

// One-to-many / many-to-many fields render as a table looping over the row list
function tabTablePrintVar(field: EruptFieldModel, tabBuild: EruptBuildModel): PrintVar {
    const item = field.fieldName + 'Item';
    const cols = tabBuild.eruptModel.eruptFieldModels.filter(isColumnField);
    const subVars = cols.map(sf => ({
        value: fieldExpr(`${item}.${sf.fieldName}`, sf),
        label: sf.eruptFieldJson.edit.title
    }));
    const th = cols.map(sf => `<th style="${TH_STYLE}">${sf.eruptFieldJson.edit.title}</th>`).join('');
    const td = subVars.map(v => `<td style="${TD_STYLE}">$!{${v.value}}</td>`).join('');
    return {
        value: field.fieldName,
        label: field.eruptFieldJson.edit.title,
        template: `
            <table style="width:100%;border-collapse: collapse;">
                <thead><tr>${th}</tr></thead>
                <tbody>
                    <!--#foreach($${item} in $${field.fieldName})-->
                    <tr>${td}</tr>
                    <!--#end-->
                </tbody>
            </table>
        `,
        vars: subVars
    };
}

// Build print vars from an erupt model, dispatching on each field's edit type
export function eruptToPrintVars(eruptBuild: EruptBuildModel): PrintVar[] {
    const vars: PrintVar[] = [];
    for (const f of eruptBuild.eruptModel.eruptFieldModels) {
        const edit = f.eruptFieldJson.edit;
        if (!edit.title || NOT_PRINTABLE_TYPES.includes(edit.type)) continue;
        switch (edit.type) {
            case EditType.TAB_TABLE_ADD:
            case EditType.TAB_TABLE_REFER: {
                const tabBuild = eruptBuild.tabErupts?.[f.fieldName];
                if (tabBuild) {
                    vars.push(tabTablePrintVar(f, tabBuild));
                }
                break;
            }
            case EditType.COMBINE: {
                const combine = eruptBuild.combineErupts?.[f.fieldName];
                combine?.eruptFieldModels.filter(isColumnField).forEach(cf => {
                    vars.push({
                        value: fieldExpr(`${f.fieldName}.${cf.fieldName}`, cf),
                        label: `${edit.title} · ${cf.eruptFieldJson.edit.title}`
                    });
                });
                break;
            }
            default:
                vars.push({value: fieldExpr(f.fieldName, f), label: edit.title});
        }
    }
    return vars;
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

    // Escape regex metacharacters in a variable code before building a matcher.
    private escapeRegExp(str: string): string {
        return String(str ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    initMention(editor: any) {
        const vars = this.flatVars();
        if (!vars || vars.length === 0) return;
        if (editor.getData && editor.getData.isHijacked) return;
        const that = this;

        const originalSetData = editor.setData.bind(editor);
        editor.setData = function (data: string) {
            let processedData = data || '';
            // Template vars are stored as <!--TEMPLATE:code-->...<!--/TEMPLATE:code--> blocks.
            // Convert back to the block widget div so CKEditor can upcast it. The base64
            // data-display-html lets the widget restore the visual table preview on load.
            processedData = processedData.replace(
                /<!--TEMPLATE:([\w.]+)-->([\s\S]*?)<!--\/TEMPLATE:\1-->/g,
                (_match, code) => {
                    const v = vars.find(x => x.value === code);
                    if (!v) return _match;
                    let enc = '';
                    try { enc = btoa(unescape(encodeURIComponent(that.renderVar(v)))); } catch (_) {}
                    return `<div data-template-var="${code}" data-label="${v.label}" data-color="${that.primaryColor}" data-display-html="${enc}"></div>`;
                }
            );
            // Simple vars are stored as Velocity quiet-reference tokens: $!{code}
            vars.forEach(v => {
                if (!v.template) {
                    const reg = new RegExp(`\\$!\\{${that.escapeRegExp(v.value)}\\}`, 'g');
                    processedData = processedData.replace(reg, that.renderVar(v));
                }
            });
            return originalSetData(processedData);
        };

        const originalGetData = editor.getData.bind(editor);
        editor.getData = function (options?: any) {
            let data = originalGetData(options);
            if (!data || typeof data !== 'string') return data;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            // Simple var chips → $!{code} tokens
            tempDiv.querySelectorAll('span[data-variable="true"]').forEach((el: any) => {
                el.replaceWith('$!' + `{${el.getAttribute('data-id')}}`);
            });
            // Template var block widgets → full Velocity HTML wrapped in marker comments.
            // Parsing through a temp element preserves HTML comments (<!--#foreach-->,
            // <!--#end-->) as DOM Comment nodes, which innerHTML serializes back faithfully.
            tempDiv.querySelectorAll('div[data-template-var]').forEach((el: any) => {
                const code = el.getAttribute('data-template-var');
                const matchedVar = vars.find(v => v.value === code);
                if (matchedVar && matchedVar.template) {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = `<!--TEMPLATE:${code}-->${matchedVar.template}<!--/TEMPLATE:${code}-->`;
                    while (tmp.firstChild) {
                        el.parentNode.insertBefore(tmp.firstChild, el);
                    }
                    el.remove();
                }
            });
            return tempDiv.innerHTML;
        };
        editor.getData.isHijacked = true;
    }

    addVar(v: PrintVar) {
        const editor = this.ck.instance;
        if (!editor) return;
        if (v.template) {
            // Template vars are block-level widgets that show the rendered table preview.
            // The full Velocity HTML (with <!--#foreach--> etc.) is only emitted by getData().
            editor.model.change((writer: any) => {
                const el = writer.createElement('printTemplateVar', {
                    code: v.value, label: v.label, color: this.primaryColor,
                    displayHtml: this.renderVar(v)
                });
                editor.model.insertContent(el);
            });
            return;
        }
        editor.model.change((writer: any) => {
            const el = writer.createElement('printVar', {
                code: v.value, label: v.label, color: this.primaryColor
            });
            editor.model.insertContent(el);
        });
    }

    // Returns the span chip HTML for a var (always a chip, regardless of template).
    private renderVarChip(v: PrintVar): string {
        const color = this.primaryColor;
        return `<span class="erupt-print-var mention" data-variable="true" data-id="${v.value}" data-label="${v.label}" data-color="${color}" style="color: ${color};margin: 0 2px;font-weight: bold;" contenteditable="false"><span style="opacity: 0.5;">{&nbsp;</span>${v.label}<span style="opacity: 0.5;">&nbsp;}</span></span>`;
    }

    renderVar(v: PrintVar) {
        if (v.template) {
            let processedTemplate = v.template;
            if (v.vars && v.vars.length > 0) {
                v.vars.forEach(subVar => {
                    const reg = new RegExp(`\\$!\\{${this.escapeRegExp(subVar.value)}\\}`, 'g');
                    processedTemplate = processedTemplate.replace(reg, this.renderVar(subVar));
                });
            }
            return processedTemplate;
        }
        // data-label / data-color let PrintVarPlugin rebuild the chip faithfully on
        // upcast; data-variable + data-id are what getData() maps back to $!{code}.
        return this.renderVarChip(v);
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
