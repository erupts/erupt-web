import {NzConfigService} from "ng-zorro-antd/core/config";
import {WindowModel} from "@shared/model/window.model";

// Header color configuration (settings drawer, persisted as
// localStorage["header-color"]). The value is either "primary" (follow the
// runtime theme color) or a literal CSS color; null/empty restores the
// theme-driven defaults from tokens.less.
//
// Implementation: the --erupt-header-* tokens are set as inline styles on
// <html>. Inline custom properties win over both the light and dark token
// blocks, so a single mechanism covers every theme.

const HEADER_TOKENS = [
    "--erupt-header-bg",
    "--erupt-header-text",
    "--erupt-header-text-secondary",
    "--erupt-header-fill",
    "--erupt-header-fill-strong",
    "--erupt-header-active-bg",
    "--erupt-header-active-text",
    "--erupt-header-border",
    "--erupt-header-progress"
];

export function applyHeaderColor(value: string | null): void {
    const el = document.documentElement;
    HEADER_TOKENS.forEach(p => el.style.removeProperty(p));
    if (!value) {
        return;
    }
    const bg = value === "primary" ? "var(--ant-primary-color)" : value;
    const resolved = value === "primary"
        ? getComputedStyle(el).getPropertyValue("--ant-primary-color").trim() || "#1677ff"
        : value;
    el.style.setProperty("--erupt-header-bg", bg);
    if (isDarkColor(resolved)) {
        // Dark/colored bar — white foreground, translucent-white states
        el.style.setProperty("--erupt-header-text", "rgba(255, 255, 255, 0.95)");
        el.style.setProperty("--erupt-header-text-secondary", "rgba(255, 255, 255, 0.75)");
        el.style.setProperty("--erupt-header-fill", "rgba(255, 255, 255, 0.15)");
        el.style.setProperty("--erupt-header-fill-strong", "rgba(255, 255, 255, 0.25)");
        el.style.setProperty("--erupt-header-active-bg", "rgba(255, 255, 255, 0.22)");
        el.style.setProperty("--erupt-header-active-text", "#fff");
        el.style.setProperty("--erupt-header-border", "rgba(0, 0, 0, 0.12)");
        // Route-loading bar sits on top of the header; a brand-colored bar would vanish on a
        // brand-colored header, so it follows the header foreground instead
        el.style.setProperty("--erupt-header-progress", "#fff");
    } else {
        // Light custom bar — ink foreground, translucent-black states
        el.style.setProperty("--erupt-header-text", "rgba(0, 0, 0, 0.88)");
        el.style.setProperty("--erupt-header-text-secondary", "rgba(0, 0, 0, 0.65)");
        el.style.setProperty("--erupt-header-fill", "rgba(0, 0, 0, 0.06)");
        el.style.setProperty("--erupt-header-fill-strong", "rgba(0, 0, 0, 0.11)");
        el.style.setProperty("--erupt-header-active-bg", "rgba(0, 0, 0, 0.08)");
        el.style.setProperty("--erupt-header-active-text", "rgba(0, 0, 0, 0.88)");
        el.style.setProperty("--erupt-header-border", "rgba(0, 0, 0, 0.1)");
        el.style.setProperty("--erupt-header-progress", "rgba(0, 0, 0, 0.85)");
    }
}

// Perceived-luminance check for #rgb / #rrggbb / rgb() / rgba() colors;
// unparseable values are treated as dark (white text is the safer default).
export function isDarkColor(color: string): boolean {
    let r: number, g: number, b: number;
    const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    const rgb = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (hex) {
        let h = hex[1];
        if (h.length === 3) {
            h = h.split("").map(c => c + c).join("");
        }
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
    } else if (rgb) {
        [r, g, b] = [+rgb[1], +rgb[2], +rgb[3]];
    } else {
        return true;
    }
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.6;
}

// ── Theme (primary) color ────────────────────────────────────────────────
// Shared by the settings drawer and the login page so the two pickers cannot
// drift apart. Persisted as localStorage["theme-color"]; startup.service
// applies the saved value over the site config default on every boot.

// Curated palette: mid-tone (600-level) hues that stay readable under white
// text and hold up in both the light and dark themes.
export const THEME_PRESET_COLORS: string[] = [
    "#1677ff", // daybreak blue (ant design)
    "#2563eb", // sapphire blue
    "#0ea5e9", // sky blue
    "#4f46e5", // indigo
    "#7c3aed", // violet
    "#c026d3", // fuchsia
    "#db2777", // rose pink
    "#e11d48", // rose red
    "#ff6b2a", // erupt lava orange
    "#65a30d", // lime
    "#059669", // emerald
    "#0d9488", // teal
    "#0891b2", // peacock cyan
    "#475569"  // graphite slate
];

// Raft candy palette (400-level hues from raft.build) — offered while the
// brutalist skin is on: pastel accents designed to pair with ink borders and
// dark text rather than the white-text mid-tones above.
export const BRUTALIST_PRESET_COLORS: string[] = [
    "#fe7da8", // raft pink (site default accent)
    "#f97264", // raft red
    "#f8a16f", // raft orange
    "#ffd441", // raft yellow
    "#a9d877", // raft lime
    "#28ccf3", // raft cyan
    "#bbafe6", // raft purple
    "#c0b9b1"  // raft stone
];

export const DEFAULT_THEME_COLOR = "#1677ff";

// <input type="color"> only accepts #rrggbb; the site config may use rgb().
export function toHexColor(color: string): string {
    const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) {
        return "#" + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, "0")).join("");
    }
    return color;
}

// Persist and apply a primary color. Passing null clears the user's choice and
// falls back to the site config default.
export function applyThemeColor(nzConfigService: NzConfigService, color: string | null): string {
    if (color) {
        localStorage.setItem("theme-color", color);
    } else {
        localStorage.removeItem("theme-color");
    }
    const primaryColor = color || WindowModel.theme?.primaryColor || DEFAULT_THEME_COLOR;
    nzConfigService.set("theme", {...WindowModel.theme, primaryColor});
    return primaryColor;
}
