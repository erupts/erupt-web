import {ReportDSL, ReportFrame, ReportType} from "./dashboard.model";

export enum PropKind {
    TEXT = 'text',
    TEXTAREA = 'textarea',
    NUMBER = 'number',
    COLOR = 'color',
    SWITCH = 'switch',
    SELECT = 'select',
    ALIGN = 'align',
}

/** One editable value of a widget, kept under `report.ui[key]` and drawn by the property panel */
export interface PropField {
    key: string;
    label: string;       // i18n key
    kind: PropKind;
    options?: { value: string; label: string }[];  // PropKind.SELECT; label is an i18n key
    min?: number;
    max?: number;
}

/** What makes up a kind of widget: how it is listed, what it starts as and what can be set on it */
export interface WidgetDef {
    type: ReportType;
    icon: string;        // nz-icon type
    size: [number, number];
    ui: Record<string, any>;
    fields: PropField[];
}

const INK = '#d9e9f4', ACCENT = '#22d3ee';

const COLOR: PropField = {key: 'color', label: 'cube.widget.color', kind: PropKind.COLOR};
const FONT_SIZE: PropField = {key: 'fontSize', label: 'cube.report.config.font_size', kind: PropKind.NUMBER, min: 8, max: 400};
const SRC: PropField = {key: 'src', label: 'cube.widget.src', kind: PropKind.TEXT};

export const WIDGETS: WidgetDef[] = [
    {
        type: ReportType.LABEL, icon: 'font-size', size: [360, 60],
        ui: {text: '', fontSize: 28, color: INK, align: 'center', bold: true, letterSpacing: 2},
        fields: [
            {key: 'text', label: 'cube.widget.text', kind: PropKind.TEXTAREA},
            FONT_SIZE, COLOR,
            {key: 'align', label: 'cube.widget.align', kind: PropKind.ALIGN},
            {key: 'bold', label: 'cube.widget.bold', kind: PropKind.SWITCH},
            {key: 'letterSpacing', label: 'cube.widget.letter_spacing', kind: PropKind.NUMBER, min: 0, max: 100},
        ]
    },
    {
        type: ReportType.IMAGE, icon: 'picture', size: [320, 200],
        ui: {src: '', fit: 'contain'},
        fields: [SRC, {
            key: 'fit', label: 'cube.widget.fit', kind: PropKind.SELECT,
            options: ['contain', 'cover', 'fill'].map(value => ({value, label: 'cube.widget.fit.' + value}))
        }]
    },
    {
        type: ReportType.BORDER, icon: 'border', size: [480, 300],
        ui: {style: 'corner', color: ACCENT},
        fields: [{
            key: 'style', label: 'cube.widget.style', kind: PropKind.SELECT,
            options: [
                {value: 'line', label: 'cube.screen.panel.border'},
                {value: 'corner', label: 'cube.screen.panel.corner'},
                {value: 'glow', label: 'cube.widget.style.glow'},
            ]
        }, COLOR]
    },
    {
        type: ReportType.DIVIDER, icon: 'line', size: [480, 12],
        ui: {color: ACCENT, vertical: false},
        fields: [COLOR, {key: 'vertical', label: 'cube.widget.vertical', kind: PropKind.SWITCH}]
    },
    {
        type: ReportType.CLOCK, icon: 'clock-circle', size: [320, 50],
        ui: {format: 'yyyy-MM-dd HH:mm:ss', fontSize: 24, color: INK},
        fields: [{key: 'format', label: 'cube.widget.format', kind: PropKind.TEXT}, FONT_SIZE, COLOR]
    },
    {
        type: ReportType.IFRAME, icon: 'global', size: [640, 360],
        ui: {src: ''},
        fields: [SRC]
    },
    {
        type: ReportType.VIDEO, icon: 'video-camera', size: [640, 360],
        ui: {src: '', loop: true, muted: true},
        fields: [
            SRC,
            {key: 'loop', label: 'cube.widget.loop', kind: PropKind.SWITCH},
            {key: 'muted', label: 'cube.widget.muted', kind: PropKind.SWITCH},
        ]
    },
];

export function widgetDef(type: ReportType): WidgetDef | undefined {
    return WIDGETS.find(it => it.type === type);
}

/** A new widget of the given kind, placed near the top left of the canvas */
export function newWidget(def: WidgetDef, ui?: Record<string, any>): ReportDSL {
    const frame: ReportFrame = {x: 60, y: 60, width: def.size[0], height: def.size[1]};
    return {type: def.type, x: 0, y: 0, cols: 6, rows: 3, cube: {}, ui: {...def.ui, ...ui}, frame};
}

/**
 * The address a widget may load: http(s), or a path of this site. Anything else (javascript:, data:, a
 * bare word) is refused, so a URL typed into a screen cannot run script in the application's own page.
 */
export function safeSrc(src: any): string | null {
    if (typeof src !== 'string') return null;
    const url = src.trim();
    return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : null;
}
