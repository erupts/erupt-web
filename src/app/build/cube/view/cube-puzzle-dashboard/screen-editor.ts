import Moveable from "moveable";
import {ReportFrame} from "../../model/dashboard.model";

/** Pixels of the display the pointer must travel before a press counts as a drag */
const DRAG_THRESHOLD = 4;

const ALL_SIDES = {top: true, left: true, bottom: true, right: true, center: true, middle: true};

/** Writes a frame onto the element showing it; the template binds the very same values */
export function applyFrame(el: HTMLElement, frame: ReportFrame): void {
    el.style.left = frame.x + 'px';
    el.style.top = frame.y + 'px';
    el.style.width = frame.width + 'px';
    el.style.height = frame.height + 'px';
    el.style.transform = `rotate(${frame.rotate || 0}deg)`;
}

/**
 * Free layout of a data screen while it is being edited: drag, resize and rotate of the selected reports
 * (one, or several as a group), snapping to the canvas edges, its center lines and the other reports. It
 * writes every change to the frame objects it was handed and to the elements' style, so nothing has to be
 * detected or rendered again: construct and drive it outside the Angular zone.
 */
export class ScreenEditor {

    private readonly moveable: Moveable;

    private frames: ReportFrame[] = [];

    private els: HTMLElement[] = [];

    /** Where the frames of a group were when its drag began */
    private starts: { x: number; y: number }[] = [];

    private scale = 1;

    /** The pointer has travelled far enough since the press for it to be a drag */
    private dragging = false;

    /**
     * @param canvas the element the reports are positioned in; its direct `.screen-item` children are the reports
     * @param width  width of the canvas in its own pixels (the design resolution)
     * @param height height of the canvas in its own pixels
     */
    constructor(private readonly canvas: HTMLElement, private readonly width: number, private readonly height: number) {
        this.moveable = new Moveable(canvas, {
            draggable: true,
            resizable: true,
            rotatable: true,
            snappable: true,
            origin: false,
            snapThreshold: 6,
            isDisplaySnapDigit: true,
            snapDirections: ALL_SIDES,
            elementSnapDirections: ALL_SIDES,
            verticalGuidelines: [0, width / 2, width],
            horizontalGuidelines: [0, height / 2, height],
            snapRotationDegrees: [0, 45, 90, 135, 180, 225, 270, 315],
            snapRotationThreshold: 3,
        });
        const m = this.moveable;
        // one report
        m.on('dragStart', () => this.dragging = false);
        m.on('drag', e => this.held(e.inputEvent) && this.dragged(e.dist, this.scale)
            && this.change(e.target, {x: e.left, y: e.top}));
        m.on('resize', e => this.change(e.target, this.resized(e)));
        m.on('rotateStart', e => e.set(this.frameOf(e.target)?.rotate || 0));
        m.on('rotate', e => this.change(e.target, {rotate: e.rotation}));
        // Several, moved as one. A group reports its drag in pixels of the display, not of the scaled canvas
        // (a single report's does not need this), so the distance is brought back by the scale. A group is
        // only moved: resizing and rotating one are switched off in select().
        m.on('dragGroupStart', () => {
            this.dragging = false;
            this.starts = this.frames.map(it => ({x: it.x, y: it.y}));
        });
        m.on('dragGroup', e => this.held(e.inputEvent) && this.dragged(e.dist, 1) && this.els.forEach((el, i) => this.change(el, {
            x: this.starts[i].x + e.dist[0] / this.scale, y: this.starts[i].y + e.dist[1] / this.scale
        })));
    }

    /**
     * Selects reports: `els[i]` shows `frames[i]`. Given the mouse event that picked them, the drag starts
     * with that same press. A selection that is not movable only shows its box.
     */
    select(els: HTMLElement[], frames: ReportFrame[], movable = true, event?: MouseEvent): void {
        this.els = els;
        this.frames = frames;
        const single = els.length === 1;
        // the target is set a moment later than this call: see whether the press is over by then
        let released = false;
        const release = () => released = true;
        if (event) document.addEventListener('mouseup', release, true);
        this.moveable.setState({
            target: single ? els[0] : els,
            draggable: movable,
            resizable: movable && single,
            rotatable: movable && single,
            elementGuidelines: Array.from(this.canvas.querySelectorAll<HTMLElement>(':scope > .screen-item'))
                .filter(it => !els.includes(it)),
        }, () => {
            document.removeEventListener('mouseup', release, true);
            // only while the button is still down: started after a quick click was over, the drag would have
            // no release to end it and the report would follow a pointer nobody is holding
            if (event && !released) this.moveable.dragStart(event);
        });
    }

    clear(): void {
        this.els = [];
        this.frames = [];
        this.moveable.target = null;
    }

    /** Moves the selected reports by a few pixels (arrow keys) */
    nudge(x: number, y: number): void {
        if (!this.moveable.draggable) return;
        this.els.forEach((el, i) => this.change(el, {x: this.frames[i].x + x, y: this.frames[i].y + y}));
        this.refresh();
    }

    /** Snaps to the designer's own guides as well as to the canvas edges and center lines */
    guides(vertical: number[], horizontal: number[]): void {
        this.moveable.verticalGuidelines = [0, this.width / 2, this.width, ...vertical];
        this.moveable.horizontalGuidelines = [0, this.height / 2, this.height, ...horizontal];
    }

    /** The stage is shown at this scale: keep the handles their size on the display */
    zoom(scale: number): void {
        this.scale = scale;
        this.moveable.zoom = 1 / scale;
        this.refresh();
    }

    /** Call after a selected report was moved by anything else than this editor */
    refresh(): void {
        this.moveable.updateRect();
    }

    destroy(): void {
        this.moveable.destroy();
    }

    /**
     * Whether a press has become a drag. A click must not move anything: a hand is never perfectly still,
     * and the first pixel of movement would let the snapping pull the report onto the nearest guideline.
     * @param dist  how far the gesture has come
     * @param scale what brings that distance to pixels of the display
     */
    private dragged(dist: number[], scale: number): boolean {
        return this.dragging ||= Math.hypot(dist[0], dist[1]) * scale >= DRAG_THRESHOLD;
    }

    /**
     * Whether the mouse button is down in the event behind a drag. A drag never moves anything without it:
     * the second guard, should a drag ever outlive its press. (A touch has no buttons and passes.)
     */
    private held(input: any): boolean {
        if (input instanceof MouseEvent && input.buttons === 0) {
            this.moveable.stopDrag();
            return false;
        }
        return true;
    }

    private frameOf(target: Element): ReportFrame | undefined {
        return this.frames[this.els.indexOf(target as HTMLElement)];
    }

    private resized(e: { width: number; height: number; drag: { left: number; top: number } }): Partial<ReportFrame> {
        return {width: Math.max(20, e.width), height: Math.max(20, e.height), x: e.drag.left, y: e.drag.top};
    }

    private change(target: Element, part: Partial<ReportFrame>): void {
        const frame = this.frameOf(target);
        if (!frame) return;
        for (const [key, value] of Object.entries(part)) {
            frame[key] = Math.round(value as number);
        }
        applyFrame(target as HTMLElement, frame);
    }

}
