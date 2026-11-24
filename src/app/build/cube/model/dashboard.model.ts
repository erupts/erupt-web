import {GridsterItemConfig} from "angular-gridster2";
import {CubeOperator, FilterGroup, Sort} from "./cube-query.model";

export interface EruptUser {
    id: number;
    avatar: string;
    name: string;
}

export interface Dashboard {
    id?: number;
    createTime?: Date | string;
    updateTime?: Date | string;
    createUser?: EruptUser;
    updateUser?: EruptUser;
    code: string;
    name: string;
    description?: string;

    type?: DashboardType;  // chosen when the dashboard is created; absent = a dashboard

    source?: string;  // cube source: null/"local" = this application, otherwise an erupt-cloud node name
    cuber: string;
    explore: string;

    draftDsl?: DashboardDSL;
    publishDsl?: DashboardDSL;
    publishTime?: Date | string;  // publish time
}

export interface DashboardPublishHistory {
    id: number;
    dashboardId: number;
    description?: string;
    dsl?: DashboardDSL;
    createTime?: Date | string;
    createUser?: EruptUser;
}

export enum DashboardTheme {
    LIGHT = 'light',
    DARK = 'dark',
}

/**
 * Dashboard DSL definition
 */
export interface DashboardDSL {
    filters?: FilterDSL[];
    reports?: ReportDSL[];
    settings?: DashboardSettings;
    subModels?: SubModelDSL[];
}

export interface SubModelDSL {
    id: string;
    alias: string;
    source?: string;  // cube source: null/"local" = this application, otherwise an erupt-cloud node name
    cube: string;
    explore: string;
    fieldMappings?: FieldMapping[];
}

export interface FieldMapping {
    dashboardField: string;
    subField: string;
}

export enum DashboardType {
    DASHBOARD = 'DASHBOARD',
    // A data screen: a canvas at a fixed design resolution, scaled to whatever display shows it,
    // on which reports and decorations are placed freely
    SCREEN = 'SCREEN',
}

/** How the design resolution of a data screen meets the display */
export enum ScreenFit {
    CONTAIN = 'contain',  // keep the design ratio, whole screen visible
    WIDTH = 'width',      // keep the design ratio, fill the width and scroll vertically
    STRETCH = 'stretch',  // fill both ways by distorting
}

export enum ScreenPanel {
    NONE = 'none',
    BORDER = 'border',      // a hairline frame
    CORNER = 'corner',      // the frame with a bracket top left and bottom right
    BRACKET = 'bracket',    // a bracket in each of the four corners
    GLOW = 'glow',          // a lit frame
    CHAMFER = 'chamfer',    // two corners cut off
    HEADLINE = 'headline',  // no frame, the title on a band
    GLASS = 'glass',        // a rounded, translucent card
}

/** How the title bar of a screen is laid out */
export enum ScreenHeader {
    LEFT = 'left',      // title at the left, clock at the right
    CENTER = 'center',  // title in the middle over a rule
    PLATE = 'plate',    // title in the middle on a plate hanging from the top edge
    LINES = 'lines',    // title in the middle between two lines
}

/** The series colors charts take when a report sets none of its own */
export enum ScreenPalette {
    TECH = 'tech',
    NEON = 'neon',
    OCEAN = 'ocean',
    WARM = 'warm',
    ACCENT = 'accent',  // tints of the screen's accent color
}

/** The typeface of figures (a KPI's value) */
export enum ScreenNumberFont {
    MONO = 'mono',
    CONDENSED = 'condensed',
    SANS = 'sans',
}

export interface ScreenSettings {
    width?: number;      // design resolution
    height?: number;
    fit?: ScreenFit;
    header?: boolean;    // title bar with a clock
    title?: string;      // blank = the dashboard name
    panel?: ScreenPanel;
    accent?: string;                // the one color of the chrome: marks, brackets, rules
    palette?: ScreenPalette;
    headerStyle?: ScreenHeader;
    titleSize?: number;             // px, of the screen title
    logo?: string;                  // an image in place of the title's mark
    clock?: boolean;
    clockFormat?: string;           // an Angular date format
    panelTitleSize?: number;        // px, of a report's title
    numberFont?: ScreenNumberFont;
    chartFontSize?: number;         // px, of axis labels and legends
}

export interface DashboardSettings {
    screen?: ScreenSettings;  // read only when the dashboard is a DashboardType.SCREEN
    backgroundColor?: string;
    backgroundImage?: string;
    theme?: DashboardTheme;
    autoRefreshInterval?: number; // auto-refresh interval (seconds), 0 means no auto-refresh
    gap?: number;                 // report spacing
}

export interface FilterDSL {
    title: string;
    field: string;
    hidden?: boolean;
    notNull?: boolean;  // exclude null values (dropdown option filter)
    operator?: CubeOperator;
    // Absolute value, or relative-time string "PAST:<days>" / "FUTURE:<days>"
    defaultValue?: any;
    value?: any;
    linkage?: string[]; // linkage
}

/** Parse "PAST:7" / "FUTURE:14" from defaultValue. Returns null for absolute values. */
export function parseRelativeDefault(value: any): {type: 'PAST' | 'FUTURE'; days: number} | null {
    if (typeof value !== 'string') return null;
    const m = value.match(/^(PAST|FUTURE):(\d+)$/);
    return m ? {type: m[1] as 'PAST' | 'FUTURE', days: parseInt(m[2], 10)} : null;
}

export interface CompareConfig {
    enabled?: boolean;
    type?: 'YOY' | 'MOM';
    filterField?: string;
    currentLabel?: string;
    compareLabel?: string;
}

/**
 * Report DSL definition
 */
/** Where a report sits on a data screen, in pixels of the design resolution */
export interface ReportFrame {
    x: number;
    y: number;
    width: number;
    height: number;
    rotate?: number;  // degrees
}

export interface ReportDSL extends GridsterItemConfig {
    // Position on a data screen. The grid position (x, y, cols, rows) stays the dashboard's own,
    // so switching the mode back and forth loses neither layout
    frame?: ReportFrame;
    type?: ReportType;
    title?: string;
    description?: string;
    subModel?: string;
    cube?: Partial<Record<CubeKey | string, string[] | string>>
    ui?: Record<string, any>;
    sorts?: Sort[];
    filterGroups?: FilterGroup[];
    compare?: CompareConfig;
}

export enum CubeKey {
    xField = 'xField',
    yField = 'yField',
    seriesField = 'seriesField',
    sizeField = "sizeField",
    colorField = 'colorField',

    sourceField = 'sourceField',
    targetField = 'targetField',
    weightField = 'weightField',

    rowsField = 'rowsField',
    columnsField = 'columnsField',
    valuesField = 'valuesField',
}

/**
 * Report type enum
 */
export enum ReportType {
    LINE = 'LINE',
    AREA = 'AREA',
    BAR = 'BAR',
    COLUMN = 'COLUMN',
    PIE = 'PIE',
    SCATTER = 'SCATTER',
    RADAR = 'RADAR',
    FUNNEL = 'FUNNEL',
    DUAL_AXES = 'DUAL_AXES',
    GAUGE = 'GAUGE',
    WATERFALL = 'WATERFALL',
    WORD_CLOUD = 'WORD_CLOUD',
    ROSE = 'ROSE',
    RADIAL_BAR = 'RADIAL_BAR',

    SANKEY = 'SANKEY',
    CHORD = 'CHORD',
    MAP = 'MAP',
    BUBBLE = 'BUBBLE',
    TREEMAP = 'TREEMAP',
    HEATMAP = 'HEATMAP',

    TINY_LINE = 'TINY_LINE',
    TINY_AREA = 'TINY_AREA',
    TINY_COLUMN = 'TINY_COLUMN',
    PROGRESS = 'PROGRESS',
    RING_PROGRESS = 'RING_PROGRESS',
    TABLE = 'TABLE',
    PIVOT_TABLE = 'PIVOT_TABLE',
    KPI = 'KPI',
    TEXT = 'TEXT',

    // Widgets of a data screen: they show no data and are drawn by cube-screen-widget
    LABEL = 'LABEL',
    IMAGE = 'IMAGE',
    BORDER = 'BORDER',
    DIVIDER = 'DIVIDER',
    CLOCK = 'CLOCK',
    IFRAME = 'IFRAME',
    VIDEO = 'VIDEO',
}

const WIDGET_TYPES = new Set([
    ReportType.LABEL, ReportType.IMAGE, ReportType.BORDER, ReportType.DIVIDER,
    ReportType.CLOCK, ReportType.IFRAME, ReportType.VIDEO,
]);

/** Whether a report is a widget of a data screen (decoration or static content) rather than a chart over a cube */
export function isWidget(report: Pick<ReportDSL, 'type'> | null | undefined): boolean {
    return WIDGET_TYPES.has(report?.type);
}

/** What a report keeps under `ui.screen`: how it looks as an object on a data screen */
export interface ReportScreenStyle {
    opacity?: number;     // 0–100, absent = opaque
    panel?: ScreenPanel;  // absent = the panel style of the screen
    locked?: boolean;     // cannot be picked or moved on the canvas; a press goes to what lies below
    hidden?: boolean;     // not shown, in the editor and published alike; still listed among the layers
    group?: string;       // reports with the same value are selected, and so moved, together
}
