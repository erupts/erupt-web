import {Component, ElementRef, Input, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {MenuService} from "@delon/theme";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {AttachmentEnum, DateEnum, EditType, FormSize} from "../../model/erupt.enum";
import {View} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel, Tree} from "../../model/erupt.model";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {I18NService} from "@core";
import {loadBuiltinPrintConfig, printElement, printPageCss} from "@shared/util/print.util";
import {BuiltinPrintConfig, PrintLabelLayout} from "@shared/model/erupt-print";

// Edit types the preview prints; any other (password, empty, tpl...) is left out
const PRINTED_TYPES: EditType[] = [
    EditType.INPUT, EditType.NUMBER, EditType.COLOR, EditType.TEXTAREA, EditType.MARKDOWN, EditType.CHOICE,
    EditType.MULTI_CHOICE, EditType.TAGS, EditType.TRANSFER, EditType.CHECKBOX, EditType.SLIDER, EditType.RATE,
    EditType.DATE, EditType.REFERENCE_TREE, EditType.REFERENCE_TABLE, EditType.BOOLEAN, EditType.ATTACHMENT,
    EditType.HTML_EDITOR, EditType.CODE_EDITOR, EditType.SIGNATURE, EditType.MAP, EditType.COMBINE,
    EditType.TAB_TABLE_ADD, EditType.TAB_TABLE_REFER, EditType.MULTI_FORM, EditType.TAB_TREE, EditType.DIVIDE,
    EditType.CALLOUT
];

// Blocks that carry their own heading: a whole row, no label cell
const SECTION_TYPES: EditType[] = [
    EditType.COMBINE, EditType.TAB_TABLE_ADD, EditType.TAB_TABLE_REFER, EditType.MULTI_FORM, EditType.DIVIDE
];

// Long or wide values that take a whole row
const FULL_ROW_TYPES: EditType[] = [
    ...SECTION_TYPES, EditType.TEXTAREA, EditType.MARKDOWN, EditType.TAGS, EditType.TRANSFER, EditType.CHECKBOX,
    EditType.ATTACHMENT, EditType.HTML_EDITOR, EditType.CODE_EDITOR, EditType.SIGNATURE, EditType.MAP,
    EditType.TAB_TREE, EditType.CALLOUT
];

export interface PrintCell {
    field: EruptFieldModel;
    span: number;
    section: boolean;
}

@Component({
    standalone: false,
    selector: "erupt-print-type",
    templateUrl: "./print-type.html",
    styleUrls: ["./print-type.less"]
})
export class PrintTypeComponent implements OnInit {

    //important
    @Input() eruptBuildModel: EruptBuildModel;

    // shared with nested previews (combine fields, the flow print page), which render without the config bar
    @Input() config: BuiltinPrintConfig;

    @Input() nested = false;

    // heading printed above the form; defaults to the current menu name
    @Input() title: string;

    eruptModel: EruptModel;

    readonly editType = EditType;

    readonly attachmentEnum = AttachmentEnum;

    readonly PrintLabelLayout = PrintLabelLayout;

    private cellsCache: { col: number, cells: PrintCell[] };

    // one-to-many / many-to-many / multi-form field -> its printable columns
    tabColumns: Record<string, View[]> = {};

    // tab-tree field -> labels of its checked nodes, in tree order
    tabTreeLabels: Record<string, string> = {};

    constructor(public dataService: DataService, private i18n: I18NService, private elementRef: ElementRef,
                private menuSrv: MenuService, private router: Router) {
    }

    ngOnInit() {
        this.eruptModel = this.eruptBuildModel.eruptModel;
        if (!this.nested && !this.title) {
            this.title = this.menuSrv.getPathByUrl(this.router.url.split('?')[0]).at(-1)?.text;
        }
        if (!this.config) {
            this.config = loadBuiltinPrintConfig(this.eruptModel.eruptJson.layout?.formSize == FormSize.FULL_LINE ? 1 : 3);
        }
        for (let model of this.eruptModel.eruptFieldModels) {
            switch (model.eruptFieldJson.edit.type) {
                case EditType.TAB_TABLE_REFER:
                case EditType.TAB_TABLE_ADD:
                case EditType.MULTI_FORM:
                    const tab = this.eruptBuildModel.tabErupts?.[model.fieldName];
                    if (tab) {
                        this.tabColumns[model.fieldName] = (tab.eruptModel.tableColumns || []).filter(v => v.show);
                    }
                    break;
                case EditType.TAB_TREE:
                    this.loadTabTreeLabels(model);
                    break;
            }
        }
    }

    /**
     * The printed fields laid out on the grid. A full-row field after a partly filled row widens that
     * row's last cell, and the last cell fills the final row, so every row is complete and its lines
     * close up.
     */
    get cells(): PrintCell[] {
        const col = this.config.col;
        if (this.cellsCache?.col !== col) {
            const cells: PrintCell[] = [];
            let used = 0;
            for (const field of this.eruptModel.eruptFieldModels) {
                const edit = field.eruptFieldJson.edit;
                if (!edit?.show || !edit.title || !PRINTED_TYPES.includes(edit.type)) continue;
                const full = FULL_ROW_TYPES.includes(edit.type) || (edit.type === EditType.INPUT && edit.inputType.fullSpan);
                if (full && used > 0) {
                    cells[cells.length - 1].span += col - used;
                    used = 0;
                }
                cells.push({field, span: full ? col : 1, section: SECTION_TYPES.includes(edit.type)});
                used = full ? 0 : (used + 1) % col;
            }
            if (used > 0) {
                cells[cells.length - 1].span += col - used;
            }
            this.cellsCache = {col, cells};
        }
        return this.cellsCache.cells;
    }

    // A tab tree stores only the checked ids, so the tree is fetched to print their names
    private loadTabTreeLabels(field: EruptFieldModel) {
        const ids: any[] = field.eruptFieldJson.edit.$value;
        if (!ids?.length || !this.eruptBuildModel.tabErupts) {
            return;
        }
        const checked = new Set(ids.map(String));
        this.dataService.findTabTree(this.eruptModel.eruptName, field.fieldName).subscribe(tree => {
            const labels: string[] = [];
            const walk = (nodes: Tree[]) => nodes?.forEach(n => {
                if (checked.has(String(n.id))) {
                    labels.push(n.label);
                }
                walk(n.children);
            });
            walk(tree);
            this.tabTreeLabels[field.fieldName] = labels.join(', ');
        });
    }

    // Plain text of one cell of a one-to-many row: rows carry the stored value keyed by view.column
    getCellValue(view: View, row: any): any {
        const value = row?.[view.column];
        if (value === null || value === undefined) {
            return '';
        }
        const edit = view.eruptFieldModel?.eruptFieldJson.edit;
        switch (edit?.type) {
            case EditType.BOOLEAN:
                return this.i18n.fanyi(value ? edit.boolType.trueText : edit.boolType.falseText);
            case EditType.CHOICE:
                return view.eruptFieldModel.choiceMap?.get(String(value))?.label ?? value;
            case EditType.MULTI_CHOICE:
                return (Array.isArray(value) ? value : String(value).split(',')).map(v => view.eruptFieldModel.choiceMap?.get(v)?.label ?? v).join(', ');
            case EditType.DATE:
                return String(value).replace('T', ' ');
        }
        if (typeof value === 'object') {
            return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
        }
        return value;
    }

    // get the display value
    getDisplayValue(field: EruptFieldModel): any {
        const edit = field.eruptFieldJson.edit;
        const value = edit.$value;

        if (value === null || value === undefined) {
            return '-';
        }

        switch (edit.type) {
            case EditType.BOOLEAN:
                return value ? edit.boolType.trueText : edit.boolType.falseText;
            case EditType.DATE:
                let format = "yyyy-MM-dd";
                switch (edit.dateType.type) {
                    case DateEnum.DATE:
                        format = "yyyy-MM-dd";
                        break;
                    case DateEnum.DATE_TIME:
                        format = "yyyy-MM-dd HH:mm:ss";
                        break;
                    case DateEnum.MONTH:
                        format = "yyyy-MM";
                        break;
                    case DateEnum.WEEK:
                        format = "yyyy-ww";
                        break;
                    case DateEnum.YEAR:
                        format = "yyyy";
                        break;
                    case DateEnum.TIME:
                        format = "HH:mm:ss";
                }
                return this.i18n.datePipe.transform(value, format);
            case EditType.CHOICE:
                return field.choiceMap?.get(String(value))?.label || value;
            case EditType.MULTI_CHOICE:
                if (Array.isArray(value)) {
                    return value.map(v => field.choiceMap?.get(String(v))?.label || v).join(', ');
                }
                return value;
            case EditType.TAGS:
                if (Array.isArray(value)) {
                    return value.join(', ');
                }
                return value;
            case EditType.REFERENCE_TREE:
                return edit.$value?.label || value;
            case EditType.REFERENCE_TABLE:
                return edit.$value?.[edit.referenceTableType.label] || value;
            default:
                return value;
        }
    }

    // determine whether to display the attachment list
    hasAttachments(field: EruptFieldModel): boolean {
        const viewValue = field.eruptFieldJson.edit.$viewValue;
        return viewValue && Array.isArray(viewValue) && viewValue.length > 0;
    }

    // determine whether a signature exists
    hasSignature(field: EruptFieldModel): boolean {
        return !!field.eruptFieldJson.edit.$value;
    }

    print() {
        const c = this.config;
        printElement(this.elementRef.nativeElement, printPageCss(c.paperSize, c.orientation, `${c.margin}mm`));
    }
}
