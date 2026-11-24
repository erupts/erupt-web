import {ReportDSL} from "./dashboard.model";

interface Snapshot {
    reports: ReportDSL[];  // the live objects, in layer order
    states: string[];      // what each of them was, as JSON
}

/**
 * Undo and redo for the reports of a data screen being edited.
 *
 * A step is restored into the very objects it was taken from: the canvas tracks reports by identity, so
 * a report that only moved keeps its component (and its chart) instead of being rebuilt. A report that was
 * deleted comes back as the same object too.
 */
export class ScreenHistory {

    private readonly undoStack: Snapshot[] = [];

    private readonly redoStack: Snapshot[] = [];

    private current: Snapshot;

    constructor(reports: ReportDSL[], private readonly limit = 100) {
        this.current = this.take(reports);
    }

    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /** Records the reports as a new step, unless nothing changed since the last one; tells whether it did */
    commit(reports: ReportDSL[]): boolean {
        const next = this.take(reports);
        if (this.same(next, this.current)) return false;
        this.undoStack.push(this.current);
        if (this.undoStack.length > this.limit) this.undoStack.shift();
        this.redoStack.length = 0;
        this.current = next;
        return true;
    }

    /** Steps back. Returns the reports whose content (anything but the frame) changed, or null at the start */
    undo(reports: ReportDSL[]): ReportDSL[] | null {
        return this.step(reports, this.undoStack, this.redoStack);
    }

    /** Steps forward again. Returns like undo, or null when nothing was undone */
    redo(reports: ReportDSL[]): ReportDSL[] | null {
        return this.step(reports, this.redoStack, this.undoStack);
    }

    private step(reports: ReportDSL[], from: Snapshot[], to: Snapshot[]): ReportDSL[] | null {
        // changes not yet committed would be lost by a restore: make them a step of their own first
        if (from === this.undoStack) this.commit(reports);
        const target = from.pop();
        if (!target) return null;
        to.push(this.current);
        this.current = target;
        const changed: ReportDSL[] = [];
        target.reports.forEach((report, i) => {
            const before = JSON.stringify({...report, frame: undefined});
            for (const key of Object.keys(report)) delete report[key];
            Object.assign(report, JSON.parse(target.states[i]));
            if (JSON.stringify({...report, frame: undefined}) !== before) changed.push(report);
        });
        reports.length = 0;
        reports.push(...target.reports);
        return changed;
    }

    private take(reports: ReportDSL[]): Snapshot {
        return {reports: [...reports], states: reports.map(it => JSON.stringify(it))};
    }

    private same(a: Snapshot, b: Snapshot): boolean {
        return a.reports.length === b.reports.length
            && a.reports.every((it, i) => it === b.reports[i] && a.states[i] === b.states[i]);
    }

}
