import {ReportType} from "./dashboard.model";
import {newWidget, safeSrc, widgetDef, WIDGETS} from "./screen-widget";
import {isWidget} from "./dashboard.model";

describe('screen-widget', () => {

    it('defines every widget type once', () => {
        const types = WIDGETS.map(it => it.type);
        expect(new Set(types).size).toBe(types.length);
        expect(types.every(type => isWidget({type}))).toBe(true);
        expect(isWidget({type: ReportType.LINE})).toBe(false);
    });

    it('starts a widget from its defaults without sharing them', () => {
        const def = widgetDef(ReportType.LABEL);
        const label = newWidget(def, {text: 'Title'});
        expect(label.ui).toEqual({...def.ui, text: 'Title'});
        expect(label.frame).toEqual({x: 60, y: 60, width: 360, height: 60});
        label.ui['fontSize'] = 99;
        expect(def.ui['fontSize']).toBe(28);
    });

    it('loads http(s) and site paths only', () => {
        expect(safeSrc('https://example.com/a.png')).toBe('https://example.com/a.png');
        expect(safeSrc(' HTTP://example.com ')).toBe('HTTP://example.com');
        expect(safeSrc('/erupt-attachment/a.png')).toBe('/erupt-attachment/a.png');
        for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', '//evil.example', 'example.com', '', null, 3]) {
            expect(safeSrc(bad)).toBeNull();
        }
    });

});
