import {DashboardType, ScreenFit, ScreenPanel} from "./dashboard.model";
import {
    AlignKind, alignFrames, Axis, boundsOf, distributeFrames,
    canvasHeight, gridFrame, isScreen, safeImageSrc, SCREEN_DEFAULT, screenOf, screenTransform, STAGE_VIEW_FIT, zoomAt
} from "./screen.util";

describe('screen.util', () => {

    const screenDashboard = {code: 's', name: 's', cuber: 'c', explore: 'e', type: DashboardType.SCREEN};

    it('is a screen only when the dashboard was created as one', () => {
        expect(screenOf(undefined)).toBeNull();
        expect(screenOf({...screenDashboard, type: undefined}, {settings: {screen: {width: 800}}})).toBeNull();
        expect(screenOf({...screenDashboard, type: DashboardType.DASHBOARD})).toBeNull();
        expect(isScreen(screenDashboard)).toBe(true);
    });

    it('fills the defaults, keeps what was set and drops what it does not know', () => {
        expect(screenOf(screenDashboard)).toEqual(SCREEN_DEFAULT);
        expect(screenOf(screenDashboard, {})).toEqual(SCREEN_DEFAULT);
        const screen = screenOf(screenDashboard, {
            settings: {screen: {width: 3840, header: false, panel: ScreenPanel.NONE, title: null, rows: 12} as any}
        });
        expect(screen).toEqual({...SCREEN_DEFAULT, width: 3840, header: false, panel: ScreenPanel.NONE});
    });

    it('contains the stage and centers it', () => {
        expect(screenTransform(ScreenFit.CONTAIN, 1920, 1080, 960, 1080)).toEqual({x: 0.5, y: 0.5, left: 0, top: 270});
        expect(screenTransform(ScreenFit.CONTAIN, 1920, 1080, 3840, 1080)).toEqual({x: 1, y: 1, left: 960, top: 0});
    });

    it('fills the width or stretches both ways', () => {
        expect(screenTransform(ScreenFit.WIDTH, 1920, 1080, 960, 1080)).toEqual({x: 0.5, y: 0.5, left: 0, top: 0});
        expect(screenTransform(ScreenFit.STRETCH, 1920, 1080, 960, 1080)).toEqual({x: 0.5, y: 1, left: 0, top: 0});
    });

    it('stays unscaled in a box without a size', () => {
        expect(screenTransform(ScreenFit.CONTAIN, 1920, 1080, 0, 0)).toEqual({x: 1, y: 1, left: 0, top: 0});
    });

    it('zooms around the pointer and keeps the scale within bounds', () => {
        const fit = {x: 0.5, y: 0.5, left: 100, top: 20};
        // the stage point under (300, 220) is (400, 400): it must still be there at twice the scale
        const view = zoomAt(STAGE_VIEW_FIT, fit, 2, 300, 220);
        expect(view.zoom).toBe(2);
        expect((300 - (fit.left + view.x)) / (fit.x * view.zoom)).toBeCloseTo(400);
        expect((220 - (fit.top + view.y)) / (fit.x * view.zoom)).toBeCloseTo(400);
        expect(zoomAt(STAGE_VIEW_FIT, fit, 100, 0, 0).zoom * fit.x).toBe(4);
        expect(zoomAt(STAGE_VIEW_FIT, fit, 0.001, 0, 0).zoom * fit.x).toBeCloseTo(0.1);
    });

    it('aligns frames to the edges and center lines of a box', () => {
        const frames = () => [{x: 10, y: 20, width: 100, height: 40}, {x: 200, y: 100, width: 50, height: 60}];
        const box = boundsOf(frames());
        expect(box).toEqual({x: 10, y: 20, width: 240, height: 140});
        const at = (kind: AlignKind) => {
            const list = frames();
            alignFrames(list, kind, box);
            return list.map(it => [it.x, it.y]);
        };
        expect(at(AlignKind.LEFT)).toEqual([[10, 20], [10, 100]]);
        expect(at(AlignKind.CENTER)).toEqual([[80, 20], [105, 100]]);
        expect(at(AlignKind.RIGHT)).toEqual([[150, 20], [200, 100]]);
        expect(at(AlignKind.TOP)).toEqual([[10, 20], [200, 20]]);
        expect(at(AlignKind.MIDDLE)).toEqual([[10, 70], [200, 60]]);
        expect(at(AlignKind.BOTTOM)).toEqual([[10, 120], [200, 100]]);
    });

    it('distributes frames with equal gaps, the outer two fixed', () => {
        const frames = [
            {x: 300, y: 0, width: 100, height: 10}, {x: 0, y: 0, width: 100, height: 10}, {x: 110, y: 0, width: 50, height: 10}
        ];
        distributeFrames(frames, Axis.HORIZONTAL);
        // 400 wide, 250 taken: two gaps of 75
        expect(frames.map(it => it.x)).toEqual([300, 0, 175]);
        const two = [{x: 0, y: 0, width: 10, height: 10}, {x: 50, y: 0, width: 10, height: 10}];
        distributeFrames(two, Axis.HORIZONTAL);
        expect(two.map(it => it.x)).toEqual([0, 50]);
    });

    it('shows images from http(s) and site paths only', () => {
        for (const ok of ['https://a.example/b.png', '/erupt-attachment/cube/bg.png', 'assets/bg.png']) {
            expect(safeImageSrc(ok)).toBe(ok);
        }
        for (const bad of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//evil.example/x.png', '', null]) {
            expect(safeImageSrc(bad)).toBeNull();
        }
    });

    it('leaves the title bar out of the canvas', () => {
        expect(canvasHeight(SCREEN_DEFAULT)).toBe(1012);
        expect(canvasHeight({...SCREEN_DEFAULT, header: false})).toBe(1080);
    });

    it('carries a grid position over to the canvas', () => {
        const screen = {...SCREEN_DEFAULT, header: false};
        expect(gridFrame({x: 0, y: 0, cols: 24, rows: 12}, screen, 0)).toEqual({x: 0, y: 0, width: 1920, height: 1080});
        expect(gridFrame({x: 12, y: 6, cols: 6, rows: 3}, screen, 12)).toEqual({x: 966, y: 546, width: 468, height: 258});
    });

});
