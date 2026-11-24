import {ScreenPalette} from "./dashboard.model";

const PALETTES: Record<Exclude<ScreenPalette, ScreenPalette.ACCENT>, string[]> = {
    [ScreenPalette.TECH]: ['#22d3ee', '#39d6ad', '#f2cd68', '#f49855', '#fb6578', '#6aa8ff', '#a78bfa', '#67829a'],
    [ScreenPalette.NEON]: ['#00f5d4', '#f15bb5', '#fee440', '#00bbf9', '#9b5de5', '#ff9e00', '#7cff6b', '#ff5d73'],
    [ScreenPalette.OCEAN]: ['#4cc9f0', '#4895ef', '#7b9cff', '#48bfe3', '#56cfe1', '#64dfdf', '#80ffdb', '#a5b4fc'],
    [ScreenPalette.WARM]: ['#ffb347', '#ff7f50', '#ffd166', '#ef476f', '#f78c6b', '#e9c46a', '#f4a261', '#d98880'],
};

/** Parses #rgb / #rrggbb; null for anything else */
export function parseHex(color: string): [number, number, number] | null {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((color || '').trim());
    if (!m) return null;
    const hex = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1];
    return [0, 2, 4].map(i => parseInt(hex.substring(i, i + 2), 16)) as [number, number, number];
}

/** A color moved toward white (amount > 0) or black (amount < 0), amount within -1..1 */
function shade([r, g, b]: [number, number, number], amount: number): string {
    const to = amount > 0 ? 255 : 0, t = Math.abs(amount);
    return '#' + [r, g, b].map(c => Math.round(c + (to - c) * t).toString(16).padStart(2, '0')).join('');
}

/** The series colors of a palette; ACCENT is the accent color with lighter and darker tints of it */
export function paletteColors(palette: ScreenPalette, accent: string): string[] {
    if (palette !== ScreenPalette.ACCENT) return PALETTES[palette] || PALETTES[ScreenPalette.TECH];
    const rgb = parseHex(accent);
    if (!rgb) return PALETTES[ScreenPalette.TECH];
    // alternating around the accent, so neighbouring series stay apart
    return [0, 0.45, -0.3, 0.7, -0.5, 0.25, -0.15, 0.85].map(amount => shade(rgb, amount));
}
