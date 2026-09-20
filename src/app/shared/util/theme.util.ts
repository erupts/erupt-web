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

// The top bar color a skin falls back to when neither the user nor the site
// config picked one. The brutalist band is a candy surface in that skin's own
// language, so it tracks the theme color; every other skin keeps the bar
// defined in tokens.less or in its own theme file (the workspace frame).
export function defaultHeaderColor(): string | null {
    return document.documentElement.classList.contains("brutalist-theme") ? "primary" : null;
}

// ── Skins ────────────────────────────────────────────────────────────────
// A visual skin layered over the light/dark theme. At most one is active, so
// it is a single choice rather than independent toggles. Each non-default skin
// is an <html> class read by its theme file (src/styles/themes/*.less) and a
// same-named localStorage flag ("true" / "false") that index.html honors
// pre-bootstrap, so the preloader already renders in the right skin.
export enum Skin {
    DEFAULT = "default",
    BRUTALIST = "brutalist",
    LIQUID_GLASS = "liquid-glass",
    WORKSPACE = "workspace",
    CLASSIC = "classic"
}

// <html> class (= storage key) per skin; the default skin has none
const SKIN_CLASS: Record<Exclude<Skin, Skin.DEFAULT>, string> = {
    [Skin.BRUTALIST]: "brutalist-theme",
    [Skin.LIQUID_GLASS]: "liquid-glass",
    [Skin.WORKSPACE]: "workspace",
    [Skin.CLASSIC]: "classic"
};

// The skin whose class index.html (or a previous applySkin) put on <html>
export function currentSkin(): Skin {
    const root = document.documentElement.classList;
    const active = (Object.keys(SKIN_CLASS) as Exclude<Skin, Skin.DEFAULT>[]).find(s => root.contains(SKIN_CLASS[s]));
    return active || Skin.DEFAULT;
}

// Switch skins at runtime and persist the choice. Every flag is written on
// each change (not just the new skin's): index.html reads them pre-bootstrap
// and eruptSiteConfig.theme.skin only applies while none is saved.
export function applySkin(skin: Skin): void {
    const root = document.documentElement;
    (Object.keys(SKIN_CLASS) as Exclude<Skin, Skin.DEFAULT>[]).forEach(s => {
        root.classList.toggle(SKIN_CLASS[s], skin === s);
        localStorage.setItem(SKIN_CLASS[s], String(skin === s));
    });
}

// `resolvedThemeColor` short-circuits reading --ant-primary-color off <html>.
// Callers that change the theme color and the bar in the same tick need it:
// ng-zorro writes the custom property asynchronously, so at that point the
// computed value is still the previous color.
export function applyHeaderColor(value: string | null, resolvedThemeColor?: string): void {
    const el = document.documentElement;
    HEADER_TOKENS.forEach(p => el.style.removeProperty(p));
    if (!value) {
        return;
    }
    const bg = value === "primary" ? "var(--ant-primary-color)" : value;
    const resolved = value === "primary"
        ? resolvedThemeColor || getComputedStyle(el).getPropertyValue("--ant-primary-color").trim() || DEFAULT_THEME_COLOR
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

// ── Workspace frame color ────────────────────────────────────────────────
// The workspace skin paints its navigation chrome (header + sidebar) as one
// "frame". By default the frame is derived from the theme color; these presets
// swap it for a gradient in the language of the chat apps the skin borrows
// from. Persisted as localStorage["workspace-frame"] holding the whole preset
// (not just its key) so index.html can paint the preloader with the gradient
// before any TypeScript runs.
export interface WorkspaceFrame {
    key: string;
    label: string;
    // CSS gradient for the frame
    frame: string;
    // solid fallback: the frame's darkest stop, used where a gradient cannot
    // be (derived tints, the preloader's background-color)
    solid: string;
    // selected menu leaf: a contrasting solid that sits well on the gradient
    accent: string;
}

export const WORKSPACE_FRAME_PRESETS: WorkspaceFrame[] = [
    {key: "aubergine", label: "Aubergine", frame: "linear-gradient(160deg, #4a154b 0%, #611f69 55%, #350d36 100%)", solid: "#4a154b", accent: "#1164a3"},
    {key: "ocean", label: "Ocean", frame: "linear-gradient(160deg, #0b2f6b 0%, #1857b8 100%)", solid: "#0b2f6b", accent: "#00b8d9"},
    {key: "lagoon", label: "Lagoon", frame: "linear-gradient(160deg, #0a3d4f 0%, #12798f 100%)", solid: "#0a3d4f", accent: "#2fc0a8"},
    {key: "dusk", label: "Dusk", frame: "linear-gradient(160deg, #2b1055 0%, #4b34a0 60%, #1e3a8a 100%)", solid: "#2b1055", accent: "#7c6cf0"},
    {key: "ember", label: "Ember", frame: "linear-gradient(160deg, #5b1d3f 0%, #b53c2b 100%)", solid: "#5b1d3f", accent: "#ff8a3d"},
    {key: "rose", label: "Rose", frame: "linear-gradient(160deg, #5a1236 0%, #b0245f 100%)", solid: "#5a1236", accent: "#ff6b9d"},
    {key: "forest", label: "Forest", frame: "linear-gradient(160deg, #0d3b2e 0%, #1f7a55 100%)", solid: "#0d3b2e", accent: "#2fb673"},
    {key: "graphite", label: "Graphite", frame: "linear-gradient(160deg, #1d2230 0%, #3b4357 100%)", solid: "#1d2230", accent: "#5c7cfa"},
    {key: "midnight", label: "Midnight", frame: "linear-gradient(160deg, #0a0f1e 0%, #182338 100%)", solid: "#0a0f1e", accent: "#4c6ef5"},
    // second row: livelier three-stop blends
    {key: "nebula", label: "Nebula", frame: "linear-gradient(160deg, #1a0b3d 0%, #5b2a9d 50%, #c0397a 100%)", solid: "#1a0b3d", accent: "#ff7ab6"},
    {key: "aurora", label: "Aurora", frame: "linear-gradient(160deg, #06263a 0%, #0b6b6f 55%, #3ea36b 100%)", solid: "#06263a", accent: "#7ce7b1"},
    {key: "sunset", label: "Sunset", frame: "linear-gradient(160deg, #3a1c71 0%, #d76d77 55%, #ffaf7b 100%)", solid: "#3a1c71", accent: "#ffd166"},
    {key: "plum", label: "Plum", frame: "linear-gradient(160deg, #2d0b2e 0%, #6d1f5c 55%, #a83279 100%)", solid: "#2d0b2e", accent: "#ff9ecb"},
    {key: "cobalt", label: "Cobalt", frame: "linear-gradient(160deg, #0f1c4d 0%, #1e3fa8 55%, #3b7cf0 100%)", solid: "#0f1c4d", accent: "#7ad7ff"},
    {key: "moss", label: "Moss", frame: "linear-gradient(160deg, #1b2a1a 0%, #3b5a2e 55%, #7c8c3a 100%)", solid: "#1b2a1a", accent: "#d9e06a"},
    {key: "copper", label: "Copper", frame: "linear-gradient(160deg, #2a1410 0%, #7a3a25 55%, #c47a3a 100%)", solid: "#2a1410", accent: "#ffc98a"},
    {key: "slate", label: "Slate", frame: "linear-gradient(160deg, #1f2937 0%, #334155 55%, #64748b 100%)", solid: "#1f2937", accent: "#38bdf8"},
    {key: "ink", label: "Ink", frame: "linear-gradient(160deg, #000000 0%, #16161a 60%, #2a2a33 100%)", solid: "#000000", accent: "#a78bfa"}
];

export const WORKSPACE_FRAME_KEY = "workspace-frame";

// Inline on <html>, so they beat the skin's own html.workspace / .dark values
const WORKSPACE_FRAME_TOKENS = ["--ws-frame-image", "--ws-frame", "--ws-selected-bg"];

// The preset key the user saved, if any
export function savedWorkspaceFrame(): string | null {
    try {
        const raw = localStorage.getItem(WORKSPACE_FRAME_KEY);
        return raw ? JSON.parse(raw).key || null : null;
    } catch {
        return null;
    }
}

// Apply a preset (or none = back to the theme-derived frame). `persist`
// records it as the user's choice; startup passes false for the site default.
export function applyWorkspaceFrame(key: string | null, persist: boolean = true): void {
    const el = document.documentElement;
    const preset = key ? WORKSPACE_FRAME_PRESETS.find(p => p.key === key) : undefined;
    WORKSPACE_FRAME_TOKENS.forEach(p => el.style.removeProperty(p));
    if (persist) {
        if (preset) {
            const {label, ...stored} = preset;
            localStorage.setItem(WORKSPACE_FRAME_KEY, JSON.stringify(stored));
        } else {
            localStorage.removeItem(WORKSPACE_FRAME_KEY);
        }
    }
    if (!preset) {
        return;
    }
    el.style.setProperty("--ws-frame-image", preset.frame);
    el.style.setProperty("--ws-frame", preset.solid);
    el.style.setProperty("--ws-selected-bg", preset.accent);
}

// ── Theme (primary) color ────────────────────────────────────────────────
// Shared by the settings drawer and the login page so the two pickers cannot
// drift apart. Persisted as localStorage["theme-color"]; startup.service
// applies the saved value over the site config default on every boot.

// Curated palette: mid-tone (600-level) hues that stay readable under white
// text and hold up in both the light and dark themes.
export const THEME_PRESET_COLORS: string[] = [
    // Ordered around the hue wheel so the swatch rows read as a gradient:
    // blues → purples → pinks/reds → oranges → greens → neutral.
    "#1677ff", // daybreak blue (ant design)
    "#2563eb", // sapphire blue
    "#0ea5e9", // sky blue
    "#4f46e5", // indigo
    "#5e6ad2", // periwinkle — muted indigo, the calm SaaS default
    "#7c3aed", // violet
    "#c026d3", // fuchsia
    "#db2777", // rose pink
    "#e11d48", // rose red
    "#9f1239", // wine — deep red for finance / government skins
    "#ff6b2a", // erupt lava orange
    "#c2410c", // terracotta — earthy orange, the warm counterpart of wine
    "#65a30d", // lime
    "#15803d", // pine — the classic green between lime and emerald
    "#059669", // emerald
    "#0d9488", // teal
    "#0891b2", // peacock cyan
    "#475569"  // graphite slate
];

// Raft's own skin palette, offered while the brutalist skin is on. These are
// pastels meant to sit UNDER ink borders and near-black text — the opposite
// brief from the white-text mid-tones above, which would go muddy behind a
// 2px black frame. Ordered as raft.build lists them: the signal yellow first,
// then warm → cool around the wheel, then the two neutrals.
export const BRUTALIST_PRESET_COLORS: string[] = [
    "#ffd440", // signal
    "#fce08c", // amber
    "#fbcb9c", // peach
    "#f9b4a0", // coral
    "#f7bbcb", // blush
    "#efa9c6", // rose
    "#d6c4f0", // lilac
    "#bfc4ef", // iris
    "#a9d6f2", // sky
    "#a6e0da", // aqua
    "#c2e0ac", // sage
    "#e9ddc4", // sand
    "#d9e0e8"  // cloud
];

export const DEFAULT_THEME_COLOR = "#1677ff";

// The brutalist skin's own default accent: raft's signal yellow
export const BRUTALIST_DEFAULT_COLOR = "#ffd440";

// The brutalist palette is pastel and belongs UNDER ink borders; the normal
// palette is mid-tone and belongs UNDER white text. Neither survives in the
// other's skin, so the brutalist skin keeps its own storage slot for the
// theme color, and switching skins swaps which slot is live.
export function themeColorStorageKey(): string {
    return currentSkin() === Skin.BRUTALIST ? "theme-color-brutalist" : "theme-color";
}

// The theme color the active skin should show: the user's choice for that
// skin, else the skin's default (site config for the normal palette).
export function resolveThemeColor(): string {
    const saved = localStorage.getItem(themeColorStorageKey());
    if (saved) {
        return saved;
    }
    return currentSkin() === Skin.BRUTALIST
        ? BRUTALIST_DEFAULT_COLOR
        : WindowModel.theme?.primaryColor || DEFAULT_THEME_COLOR;
}

// <input type="color"> only accepts #rrggbb; the site config may use rgb().
export function toHexColor(color: string): string {
    const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) {
        return "#" + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, "0")).join("");
    }
    return color;
}

// Persist and apply a primary color into the active skin's slot. Passing null
// clears that choice and falls back to the skin's default.
export function applyThemeColor(nzConfigService: NzConfigService, color: string | null): string {
    if (color) {
        localStorage.setItem(themeColorStorageKey(), color);
    } else {
        localStorage.removeItem(themeColorStorageKey());
    }
    return pushThemeColor(nzConfigService, resolveThemeColor());
}

// Hand a primary color to ng-zorro without touching storage
function pushThemeColor(nzConfigService: NzConfigService, primaryColor: string): string {
    // only the color entries belong to ng-zorro; dark / compact / skin / menuMode /
    // workspaceFrame are appearance defaults read elsewhere (index.html, startup.service)
    const {dark, compact, skin, menuMode, workspaceFrame, customizable, ...colors} = WindowModel.theme || {};
    nzConfigService.set("theme", {...colors, primaryColor});
    return primaryColor;
}

// Switch skins the way every picker (settings drawer, login page, home page)
// must: toggle the skin, then re-resolve the theme color from the skin's own
// slot — entering brutalist brings its pastel, leaving it takes the pastel
// away — and re-derive the header bar, which may follow that color. Returns
// the theme color now in effect.
export function switchSkin(nzConfigService: NzConfigService, skin: Skin): string {
    applySkin(skin);
    const color = pushThemeColor(nzConfigService, resolveThemeColor());
    applyHeaderColor(
        localStorage.getItem("header-color") || WindowModel.theme?.headerColor || defaultHeaderColor(),
        toHexColor(color)
    );
    return color;
}
