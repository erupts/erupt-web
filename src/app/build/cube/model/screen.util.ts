import {
    Dashboard, DashboardDSL, DashboardType, ReportDSL, ReportFrame, ScreenFit, ScreenHeader, ScreenNumberFont,
    ScreenPalette, ScreenPanel, ScreenSettings
} from "./dashboard.model";

export const SCREEN_DEFAULT: Required<ScreenSettings> = {
    width: 1920,
    height: 1080,
    fit: ScreenFit.CONTAIN,
    header: true,
    title: '',
    panel: ScreenPanel.CORNER,
    accent: '#22d3ee',
    palette: ScreenPalette.TECH,
    headerStyle: ScreenHeader.LEFT,
    titleSize: 26,
    titleColor: '',
    logo: '',
    clock: true,
    clockFormat: 'yyyy-MM-dd HH:mm:ss',
    panelTitleSize: 15,
    panelTitleColor: '',
    numberFont: ScreenNumberFont.MONO,
    chartFontSize: 12,
};

/** Height of the title bar, which the canvas of a screen starts below */
export const SCREEN_HEADER_HEIGHT = 68;

/** Whether a dashboard was created as a data screen */
export function isScreen(dashboard?: Dashboard): boolean {
    return dashboard?.type === DashboardType.SCREEN;
}

/** The screen settings with their defaults filled in, or null when the dashboard is not a data screen */
export function screenOf(dashboard?: Dashboard, dsl?: DashboardDSL): Required<ScreenSettings> | null {
    if (!isScreen(dashboard)) return null;
    const screen: Required<ScreenSettings> = {...SCREEN_DEFAULT};
    for (const [key, value] of Object.entries(dsl?.settings?.screen || {})) {
        if (key in SCREEN_DEFAULT && value !== null && value !== undefined && value !== '') screen[key] = value;
    }
    return screen;
}

/** Height of the canvas the reports are placed on: the screen without its title bar */
export function canvasHeight(screen: Required<ScreenSettings>): number {
    return screen.height - (screen.header ? SCREEN_HEADER_HEIGHT : 0);
}

export interface ScreenTransform {
    x: number;       // horizontal scale
    y: number;       // vertical scale
    left: number;    // offset that centers the stage in the box
    top: number;
}

/** Scale and offset that lay a stage of the design resolution into a box of the given size */
export function screenTransform(fit: ScreenFit, stageWidth: number, stageHeight: number,
                                boxWidth: number, boxHeight: number): ScreenTransform {
    const x = boxWidth / stageWidth, y = boxHeight / stageHeight;
    if (!(x > 0) || !(y > 0)) return {x: 1, y: 1, left: 0, top: 0};
    if (fit === ScreenFit.STRETCH) return {x, y, left: 0, top: 0};
    if (fit === ScreenFit.WIDTH) return {x, y: x, left: 0, top: 0};
    const scale = Math.min(x, y);
    return {x: scale, y: scale, left: (boxWidth - stageWidth * scale) / 2, top: (boxHeight - stageHeight * scale) / 2};
}

/** How the designer looks at the stage: a zoom on top of the fitted scale and a pan, both zero-effect by default */
export interface StageView {
    zoom: number;  // 1 = the stage fits the viewport
    x: number;     // pan, in pixels of the viewport
    y: number;
}

export const STAGE_VIEW_FIT: StageView = {zoom: 1, x: 0, y: 0};

const MIN_SCALE = 0.1, MAX_SCALE = 4;

/**
 * Zooms the view by a factor while the point of the stage under (px, py) stays where it is.
 * @param fit    the transform that fits the stage: the view's zoom and pan come on top of it
 * @param px, py a point of the viewport, usually the pointer; the scale is kept between 10% and 400%
 */
export function zoomAt(view: StageView, fit: ScreenTransform, factor: number, px: number, py: number): StageView {
    const scale = fit.x * view.zoom;
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    const ratio = next / scale;
    const left = fit.left + view.x, top = fit.top + view.y;
    return {
        zoom: next / fit.x,
        x: px - (px - left) * ratio - fit.left,
        y: py - (py - top) * ratio - fit.top,
    };
}

/** Rows a dashboard page is read as when its grid layout is carried over to a screen */
const GRID_ROWS = 12;

/**
 * The frame of a report that has none yet: its place on the dashboard grid (24 columns), laid over the
 * canvas, so a dashboard turned into a screen starts from the layout it had.
 */
export function gridFrame(report: ReportDSL, screen: Required<ScreenSettings>, gap: number): ReportFrame {
    const cellWidth = screen.width / 24, cellHeight = canvasHeight(screen) / GRID_ROWS;
    return {
        x: Math.round((report.x || 0) * cellWidth + gap / 2),
        y: Math.round((report.y || 0) * cellHeight + gap / 2),
        width: Math.round((report.cols || 8) * cellWidth - gap),
        height: Math.round((report.rows || 4) * cellHeight - gap),
    };
}

export enum AlignKind {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    TOP = 'top',
    MIDDLE = 'middle',
    BOTTOM = 'bottom',
}

export enum Axis {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The smallest box holding every frame (rotation is not considered) */
export function boundsOf(frames: ReportFrame[]): Box {
    const x = Math.min(...frames.map(it => it.x)), y = Math.min(...frames.map(it => it.y));
    return {
        x, y,
        width: Math.max(...frames.map(it => it.x + it.width)) - x,
        height: Math.max(...frames.map(it => it.y + it.height)) - y,
    };
}

/** Moves every frame to one edge, or the center line, of the box */
export function alignFrames(frames: ReportFrame[], kind: AlignKind, box: Box): void {
    for (const frame of frames) {
        switch (kind) {
            case AlignKind.LEFT:
                frame.x = box.x;
                break;
            case AlignKind.CENTER:
                frame.x = Math.round(box.x + (box.width - frame.width) / 2);
                break;
            case AlignKind.RIGHT:
                frame.x = box.x + box.width - frame.width;
                break;
            case AlignKind.TOP:
                frame.y = box.y;
                break;
            case AlignKind.MIDDLE:
                frame.y = Math.round(box.y + (box.height - frame.height) / 2);
                break;
            case AlignKind.BOTTOM:
                frame.y = box.y + box.height - frame.height;
                break;
        }
    }
}

/** Gives the frames equal gaps along an axis; the first and the last one stay where they are */
export function distributeFrames(frames: ReportFrame[], axis: Axis): void {
    if (frames.length < 3) return;
    const [pos, size] = axis === Axis.HORIZONTAL ? ['x', 'width'] as const : ['y', 'height'] as const;
    const sorted = [...frames].sort((a, b) => a[pos] - b[pos]);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const free = last[pos] + last[size] - first[pos] - sorted.reduce((sum, it) => sum + it[size], 0);
    const gap = free / (sorted.length - 1);
    let next = first[pos];
    for (const frame of sorted) {
        frame[pos] = Math.round(next);
        next += frame[size] + gap;
    }
}

/**
 * An image address a screen may show: http(s), or a path of this site (absolute or relative). Any other
 * scheme (javascript:, data:, ...) and protocol-relative addresses are refused.
 */
export function safeImageSrc(src: any): string | null {
    if (typeof src !== 'string') return null;
    const url = src.trim();
    if (!url || url.startsWith('//')) return null;
    return /^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:\/\//i.test(url) ? null : url;
}

/** Guides the designer laid on a screen, in pixels of the design resolution: x of the vertical, y of the horizontal */
export interface ScreenGuides {
    v: number[];
    h: number[];
}

/** The tick spacing of a ruler, in design pixels: the finest of 1-2-5 steps that leaves labels room on the display */
export function rulerStep(scale: number, minGap = 56): number {
    for (const step of [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]) {
        if (step * scale >= minGap) return step;
    }
    return 10000;
}

/** Guides read back from storage: anything that is not a list of finite numbers is dropped */
export function parseGuides(raw: string | null): ScreenGuides {
    try {
        const value = JSON.parse(raw || '{}');
        const numbers = (list: any) => Array.isArray(list) ? list.filter(it => typeof it === 'number' && isFinite(it)) : [];
        return {v: numbers(value?.v), h: numbers(value?.h)};
    } catch {
        return {v: [], h: []};
    }
}
