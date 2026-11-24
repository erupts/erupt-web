import {ScreenPalette} from "./dashboard.model";
import {paletteColors, parseHex} from "./screen-palette";

describe('screen-palette', () => {

    it('parses short and long hex colors only', () => {
        expect(parseHex('#fff')).toEqual([255, 255, 255]);
        expect(parseHex(' #22D3EE ')).toEqual([34, 211, 238]);
        expect(parseHex('red')).toBeNull();
        expect(parseHex('#12345')).toBeNull();
        expect(parseHex(null)).toBeNull();
    });

    it('gives every palette eight distinct colors', () => {
        for (const palette of Object.values(ScreenPalette)) {
            const colors = paletteColors(palette, '#22d3ee');
            expect(colors.length).toBe(8);
            expect(new Set(colors).size).toBe(8);
        }
    });

    it('builds the accent palette from the accent, starting with it', () => {
        expect(paletteColors(ScreenPalette.ACCENT, '#ff0000')[0]).toBe('#ff0000');
        expect(paletteColors(ScreenPalette.ACCENT, '#ff0000')[2]).toBe('#b30000');
    });

    it('falls back to the default palette for a color it cannot read or a palette it does not know', () => {
        const tech = paletteColors(ScreenPalette.TECH, '');
        expect(paletteColors(ScreenPalette.ACCENT, 'not a color')).toEqual(tech);
        expect(paletteColors('gone' as ScreenPalette, '#fff')).toEqual(tech);
    });

});
