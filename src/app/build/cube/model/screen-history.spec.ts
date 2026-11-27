import {ReportDSL, ReportType} from "./dashboard.model";
import {ScreenHistory} from "./screen-history";

describe('ScreenHistory', () => {

    const report = (title: string, x = 0): ReportDSL =>
        ({type: ReportType.LINE, title, x: 0, y: 0, cols: 1, rows: 1, cube: {}, ui: {}, frame: {x, y: 0, width: 10, height: 10}});

    it('has nothing to undo until something changed', () => {
        const reports = [report('a')];
        const history = new ScreenHistory(reports);
        history.commit(reports);
        expect(history.canUndo).toBe(false);
        expect(history.undo(reports)).toBeNull();
    });

    it('restores a move into the same object and reports no content change', () => {
        const a = report('a');
        const reports = [a];
        const history = new ScreenHistory(reports);
        a.frame.x = 50;
        history.commit(reports);
        expect(history.undo(reports)).toEqual([]);
        expect(reports[0]).toBe(a);
        expect(a.frame.x).toBe(0);
        expect(history.redo(reports)).toEqual([]);
        expect(a.frame.x).toBe(50);
    });

    it('brings a deleted report back as the same object, in its layer', () => {
        const a = report('a'), b = report('b'), c = report('c');
        const reports = [a, b, c];
        const history = new ScreenHistory(reports);
        reports.splice(1, 1);
        history.commit(reports);
        history.undo(reports);
        expect(reports).toEqual([a, b, c]);
        expect(reports[1]).toBe(b);
    });

    it('names the reports whose content changed', () => {
        const a = report('a'), b = report('b');
        const reports = [a, b];
        const history = new ScreenHistory(reports);
        b.title = 'renamed';
        history.commit(reports);
        expect(history.undo(reports)).toEqual([b]);
        expect(b.title).toBe('b');
    });

    it('takes uncommitted changes as a step before undoing, and drops redo on a new change', () => {
        const a = report('a');
        const reports = [a];
        const history = new ScreenHistory(reports);
        a.frame.x = 10;
        history.commit(reports);
        a.frame.x = 20;
        history.undo(reports);
        expect(a.frame.x).toBe(10);
        expect(history.canRedo).toBe(true);
        a.frame.x = 99;
        history.commit(reports);
        expect(history.canRedo).toBe(false);
    });

    it('forgets the oldest steps beyond its limit', () => {
        const a = report('a');
        const reports = [a];
        const history = new ScreenHistory(reports, 2);
        for (const x of [1, 2, 3]) {
            a.frame.x = x;
            history.commit(reports);
        }
        history.undo(reports);
        history.undo(reports);
        expect(history.canUndo).toBe(false);
        expect(a.frame.x).toBe(1);
    });

    it('steps through the extras too, and gives them back only when they change', () => {
        const a = report('a');
        const reports = [a];
        const history = new ScreenHistory(reports, 100, {accent: '#111'});
        history.commit(reports, {accent: '#222'});
        a.frame.x = 30;
        history.commit(reports, {accent: '#222'});

        expect(history.undo(reports, {accent: '#222'})).toEqual([]);
        expect(history.restoredExtras).toBeNull();
        expect(a.frame.x).toBe(0);

        history.undo(reports, {accent: '#222'});
        expect(history.restoredExtras).toEqual({accent: '#111'});

        history.redo(reports, {accent: '#111'});
        expect(history.restoredExtras).toEqual({accent: '#222'});
    });

    it('takes a change of the extras alone as a step', () => {
        const reports = [report('a')];
        const history = new ScreenHistory(reports, 100, {filters: []});
        expect(history.commit(reports, {filters: []})).toBe(false);
        expect(history.commit(reports, {filters: [{field: 'city'}]})).toBe(true);
        expect(history.canUndo).toBe(true);
    });

});
