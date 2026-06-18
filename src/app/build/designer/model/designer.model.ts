import {
    AttachmentEnum,
    ChoiceEnum,
    DateEnum,
    EditType,
    FormSize,
    PagingType,
    PickerMode
} from "../../erupt/model/erupt.enum";
import {I18NService} from "@core";

/**
 * 设计器数据结构：镜像后端 @Erupt / @EruptField / @Edit / @View 注解结构（原始成员名），
 * 后端通过 JsonAnnotationProxy 将其伪装为运行时注解实例。
 */
export interface DesignerForm {
    pkg: string;
    className: string;
    tableName: string;
    erupt: DesignerErupt;
    fields: DesignerField[];
}

export interface DesignerErupt {
    name: string;
    desc?: string;
    orderBy?: string;
    power?: DesignerPower;
    layout?: DesignerLayout;
    vis?: DesignerVis[];    // multi-view config, mirrors @Erupt.vis() / @Vis
}

// multi-view type; values match backend Vis.Type enum constant names
export enum VisType {
    TABLE = "TABLE",
    CARD = "CARD",
    BOARD = "BOARD",
    GANTT = "GANTT",
    CALENDAR = "CALENDAR",
    TPL = "TPL"
}

// field visibility; values match backend Vis.FieldVisibility enum
export enum FieldVisibility {
    INCLUDE = "INCLUDE",
    EXCLUDE = "EXCLUDE"
}

// card cover effect; values match backend CardView.CoverEffect enum
export enum CoverEffect {
    FIT = "FIT",
    CLIP = "CLIP"
}

// mirrors @Vis: frontend-only key field is stripped before sending
export interface DesignerVis {
    key?: string;           // frontend-only unique identifier
    code?: string;
    title: string;
    desc?: string;
    type?: VisType;
    fieldVisibility?: FieldVisibility;
    fields?: string[];
    boardView?: { groupField?: string };
    cardView?: { coverField?: string; coverEffect?: CoverEffect };
    ganttView?: { startDateField?: string; endDateField?: string; groupField?: string; pidField?: string; progressField?: string; colorField?: string };
    calendarView?: { dateField?: string; endDateField?: string; colorField?: string };
}

export interface DesignerLayout {
    formSize?: FormSize;
    pagingType?: PagingType;
    pageSize?: number;
    tableLeftFixed?: number;
    tableRightFixed?: number;
}

export interface DesignerPower {
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
    query?: boolean;
    viewDetails?: boolean;
    export?: boolean;
    importable?: boolean;
    print?: boolean;
}

export interface DesignerField {
    key: string;            // frontend-only unique identifier
    fieldName: string;
    linkErupt?: string;     // linked @Erupt class name for reference-type fields
    view?: DesignerView;
    edit: DesignerEdit;
}

export interface DesignerView {
    title: string;
    desc?: string;
    width?: string;
    column?: string;
    show?: boolean;
    sortable?: boolean;
}

export interface DesignerEdit {
    title: string;
    desc?: string;
    notNull?: boolean;
    show?: boolean;
    placeHolder?: string;
    type: EditType;
    search?: { value?: boolean; vague?: boolean };
    readonly?: { add?: boolean; edit?: boolean };
    inputType?: { length?: number; fullSpan?: boolean; regex?: string };
    numberType?: { min?: number; max?: number };
    sliderType?: { min?: number; max?: number; step?: number; dots?: boolean };
    rateType?: { count?: number; allowHalf?: boolean };
    dateType?: { type?: DateEnum; pickerMode?: PickerMode };
    boolType?: { trueText?: string; falseText?: string };
    choiceType?: { type?: ChoiceEnum; vl?: DesignerVL[] };
    multiChoiceType?: { vl?: DesignerVL[] };
    tagsType?: { tags?: string[]; joinSeparator?: string; maxTagCount?: number; allowExtension?: boolean };
    attachmentType?: { type?: AttachmentEnum; maxLimit?: number; size?: number; fileTypes?: string[] };
    codeEditType?: { language?: string; height?: number };
    referenceTreeType?: { id?: string; label?: string; pid?: string };
    referenceTableType?: { id?: string; label?: string };
    checkboxType?: { id?: string; label?: string };
    groupType?: { fields?: string[]; collapsed?: boolean };
}

export interface DesignerVL {
    value: string;
    label: string;
}

export interface PaletteItem {
    type: EditType;
    label: string;          // i18n key
    icon: string;           // nz-icon type
    edit?: Partial<DesignerEdit>;
    needLink?: boolean;     // whether this type requires a linked @Erupt class
    noView?: boolean;       // no table column generated (e.g. divider)
    disabled?: boolean;
    disabledTip?: string;
}

export interface PaletteGroup {
    title: string;          // i18n key
    items: PaletteItem[];
}

export const PALETTE_GROUPS: PaletteGroup[] = [
    {
        title: "designer.group.basic",
        items: [
            {type: EditType.INPUT, label: "designer.type.input", icon: "edit", edit: {inputType: {length: 255}}},
            {type: EditType.TEXTAREA, label: "designer.type.textarea", icon: "file-text"},
            {type: EditType.NUMBER, label: "designer.type.number", icon: "field-number", edit: {numberType: {}}},
            {type: EditType.PASSWORD, label: "designer.type.password", icon: "lock"},
            {type: EditType.BOOLEAN, label: "designer.type.boolean", icon: "check-circle", edit: {boolType: {trueText: I18NService.instance?.fanyi('designer.bool.true'), falseText: I18NService.instance?.fanyi('designer.bool.false')}}},
            {type: EditType.DATE, label: "designer.type.date", icon: "calendar", edit: {dateType: {type: DateEnum.DATE}}},
            {type: EditType.SLIDER, label: "designer.type.slider", icon: "sliders", edit: {sliderType: {min: 0, max: 100, step: 1}}},
            {type: EditType.RATE, label: "designer.type.rate", icon: "star", edit: {rateType: {count: 5}}},
            {type: EditType.COLOR, label: "designer.type.color", icon: "bg-colors"}
        ]
    },
    {
        title: "designer.group.choice",
        items: [
            {type: EditType.CHOICE, label: "designer.type.choice", icon: "down-circle", edit: {choiceType: {type: ChoiceEnum.SELECT, vl: [{value: "1", label: I18NService.instance?.fanyi('designer.option.one')}, {value: "2", label: I18NService.instance?.fanyi('designer.option.two')}]}}},
            {type: EditType.MULTI_CHOICE, label: "designer.type.multi_choice", icon: "check-square", edit: {multiChoiceType: {vl: [{value: "1", label: I18NService.instance?.fanyi('designer.option.one')}, {value: "2", label: I18NService.instance?.fanyi('designer.option.two')}]}}},
            {type: EditType.TAGS, label: "designer.type.tags", icon: "tags", edit: {tagsType: {tags: []}}}
        ]
    },
    {
        title: "designer.group.advanced",
        items: [
            {type: EditType.ATTACHMENT, label: "designer.type.attachment", icon: "upload", edit: {attachmentType: {type: AttachmentEnum.BASE, maxLimit: 1}}},
            {type: EditType.ATTACHMENT, label: "designer.type.image", icon: "file-image", edit: {attachmentType: {type: AttachmentEnum.IMAGE, maxLimit: 1, fileTypes: ["png", "jpg", "jpeg", "gif", "webp"]}}},
            {type: EditType.HTML_EDITOR, label: "designer.type.html_editor", icon: "font-size"},
            {type: EditType.MARKDOWN, label: "designer.type.markdown", icon: "read"},
            {type: EditType.CODE_EDITOR, label: "designer.type.code_editor", icon: "code", edit: {codeEditType: {language: "json", height: 300}}},
            {type: EditType.MAP, label: "designer.type.map", icon: "environment"},
            {type: EditType.SIGNATURE, label: "designer.type.signature", icon: "highlight"}
        ]
    },
    {
        title: "designer.group.layout",
        items: [
            {type: EditType.DIVIDE, label: "designer.type.divide", icon: "line", noView: true},
            {type: EditType.GROUP, label: "designer.type.group", icon: "block", noView: true, edit: {groupType: {fields: [], collapsed: false}}}
        ]
    },
    {
        title: "designer.group.reference",
        items: [
            {type: EditType.REFERENCE_TABLE, label: "designer.type.reference_table", icon: "table", needLink: true, edit: {referenceTableType: {}}, disabled: true, disabledTip: "designer.reference.disabled_tip"},
            {type: EditType.REFERENCE_TREE, label: "designer.type.reference_tree", icon: "apartment", needLink: true, edit: {referenceTreeType: {}}, disabled: true, disabledTip: "designer.reference.disabled_tip"},
            {type: EditType.CHECKBOX, label: "designer.type.checkbox", icon: "check-square", needLink: true, edit: {checkboxType: {}}, disabled: true, disabledTip: "designer.reference.disabled_tip"},
            {type: EditType.TAB_TABLE_ADD, label: "designer.type.tab_table_add", icon: "unordered-list", needLink: true, disabled: true, disabledTip: "designer.reference.disabled_tip"},
            {type: EditType.TAB_TABLE_REFER, label: "designer.type.tab_table_refer", icon: "link", needLink: true, edit: {referenceTableType: {}}, disabled: true, disabledTip: "designer.reference.disabled_tip"},
            {type: EditType.TAB_TREE, label: "designer.type.tab_tree", icon: "node-expand", needLink: true, edit: {referenceTreeType: {}}, disabled: true, disabledTip: "designer.reference.disabled_tip"},
            {type: EditType.COMBINE, label: "designer.type.combine", icon: "swap", needLink: true, disabled: true, disabledTip: "designer.reference.disabled_tip"}
        ]
    },
];
