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
// config picked one. Every skin keeps the bar defined in tokens.less or in its
// own theme file (the workspace frame); the brutalist band is pinned below.
export function defaultHeaderColor(): string | null {
    return null;
}

// The top bar color in effect: the user's choice, then the site default
// (theme.headerColor), then the skin's own. The brutalist band is a candy
// surface in that skin's own language and always tracks the theme color: it
// is not configurable there, so a saved choice is ignored (kept for the other
// skins) and the settings drawer hides the picker.
export function resolveHeaderColor(): string | null {
    if (currentSkin() === Skin.BRUTALIST) {
        return "primary";
    }
    return localStorage.getItem("header-color") || WindowModel.theme?.headerColor || defaultHeaderColor();
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
    // The browser chrome (<meta name="theme-color">, owned by index.html) continues the bar
    const applyThemeColorMeta: ((color: string | null) => void) | undefined = window["eruptApplyThemeColor"];
    if (!value) {
        applyThemeColorMeta?.(null);
        return;
    }
    const bg = value === "primary" ? "var(--ant-primary-color)" : value;
    const resolved = value === "primary"
        ? resolvedThemeColor || getComputedStyle(el).getPropertyValue("--ant-primary-color").trim() || DEFAULT_THEME_COLOR
        : value;
    el.style.setProperty("--erupt-header-bg", bg);
    applyThemeColorMeta?.(resolved);
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
    // neutral, descriptive; shown only as the swatch tooltip
    label: string;
    // CSS gradient for the frame
    frame: string;
    // solid fallback: a mid stop of the gradient, used where a gradient cannot
    // be (derived tints, the preloader's background-color)
    solid: string;
    // selected menu leaf: a solid that reads on the gradient and carries white text.
    // Picking the preset in the settings drawer also makes it the theme color.
    accent: string;
    // a light frame: the chrome's foreground flips from white to ink, and the
    // picker lists it under "light" rather than "dark"
    light?: boolean;
}

// Soft, low-saturation two-tone diagonals plus a set of flat and blended
// single hues — the palette borrows from the navigation skins of Feishu and
// Slack (developer note; the UI groups them only by light / dark). A flat
// frame is a two-stop gradient of one color, so every preset paints the same way.
export const WORKSPACE_FRAME_PRESETS: WorkspaceFrame[] = [
    // light
    {key: "mist", label: "Mist", frame: "linear-gradient(135deg, #eef2f8 0%, #e2e8f1 100%)", solid: "#e8edf5", accent: "#3370ff", light: true},
    {key: "sky", label: "Sky", frame: "linear-gradient(135deg, #d9e8ff 0%, #eef4ff 100%)", solid: "#e3edff", accent: "#3370ff", light: true},
    {key: "azure", label: "Azure", frame: "linear-gradient(135deg, #8ec5f0 0%, #4a90d9 100%)", solid: "#6aaee6", accent: "#1d5fa8", light: true},
    {key: "salt", label: "Salt", frame: "linear-gradient(135deg, #dee5ee 0%, #eef2f6 100%)", solid: "#e6ecf2", accent: "#4c6ef5", light: true},
    {key: "gray", label: "Gray", frame: "linear-gradient(#e4e4e6, #e4e4e6)", solid: "#e4e4e6", accent: "#4a4a4a", light: true},
    {key: "mint", label: "Mint", frame: "linear-gradient(135deg, #d5f1e8 0%, #eaf8f3 100%)", solid: "#e0f5ee", accent: "#1f9d76", light: true},
    {key: "mint-chip", label: "Mint Chip", frame: "linear-gradient(135deg, #a8e6c8 0%, #a0b8ff 100%)", solid: "#a4cfe4", accent: "#2f6fd6", light: true},
    {key: "lime", label: "Lime", frame: "linear-gradient(135deg, #e4f3d4 0%, #f3f9ea 100%)", solid: "#ecf6e0", accent: "#5f9a2a", light: true},
    {key: "citrus", label: "Citrus", frame: "linear-gradient(135deg, #eaf98c 0%, #96f0a4 100%)", solid: "#c0f498", accent: "#2a8f45", light: true},
    {key: "banana", label: "Banana", frame: "linear-gradient(#ffe98a, #ffe98a)", solid: "#ffe98a", accent: "#8a6d00", light: true},
    {key: "brass", label: "Brass", frame: "linear-gradient(135deg, #e6c65a 0%, #c99a2e 100%)", solid: "#d8b044", accent: "#6b4f10", light: true},
    {key: "almond", label: "Almond", frame: "linear-gradient(135deg, #f6ecdc 0%, #faf3ea 100%)", solid: "#f8f0e4", accent: "#c47c2b", light: true},
    {key: "peach", label: "Peach", frame: "linear-gradient(135deg, #f7d7e3 0%, #f2b866 100%)", solid: "#f5c8a5", accent: "#c0662a", light: true},
    {key: "dawn", label: "Dawn", frame: "linear-gradient(135deg, #ffe3d4 0%, #fbe4ee 55%, #e7e9ff 100%)", solid: "#fbe5e8", accent: "#e0642f", light: true},
    {key: "blush", label: "Blush", frame: "linear-gradient(#ff9fc4, #ff9fc4)", solid: "#ff9fc4", accent: "#b3266b", light: true},
    {key: "raspberry", label: "Raspberry", frame: "linear-gradient(135deg, #f5c6ff 0%, #ffb3c8 100%)", solid: "#f9bde4", accent: "#c2185b", light: true},
    {key: "mauve", label: "Mauve", frame: "linear-gradient(135deg, #d9b3a3 0%, #d987b8 100%)", solid: "#d99dae", accent: "#8b3a62", light: true},
    {key: "lilac", label: "Lilac", frame: "linear-gradient(135deg, #e6e1ff 0%, #f3e9ff 100%)", solid: "#ece5ff", accent: "#7b61ff", light: true},
    {key: "lavender-mint", label: "Lavender Mint", frame: "linear-gradient(135deg, #cdb4ff 0%, #7fded0 100%)", solid: "#a6c9e8", accent: "#6b4de6", light: true},
    // dark
    {key: "deep-sea", label: "Deep Sea", frame: "linear-gradient(135deg, #1d3557 0%, #2a4d7a 100%)", solid: "#1d3557", accent: "#57a0ff"},
    {key: "lagoon", label: "Lagoon", frame: "linear-gradient(#0e4a6e, #0e4a6e)", solid: "#0e4a6e", accent: "#3a9bd9"},
    {key: "indigo", label: "Indigo", frame: "linear-gradient(#1e2a78, #1e2a78)", solid: "#1e2a78", accent: "#6c7ff2"},
    {key: "slate", label: "Slate", frame: "linear-gradient(135deg, #3c3f5c 0%, #1c2c74 100%)", solid: "#2c3568", accent: "#6a8dff"},
    {key: "starry", label: "Starry", frame: "linear-gradient(135deg, #23223f 0%, #3b3566 100%)", solid: "#23223f", accent: "#8b7cf6"},
    {key: "teal", label: "Teal", frame: "linear-gradient(135deg, #0d7a5b 0%, #0f4c5c 100%)", solid: "#0e635c", accent: "#f2a93b"},
    {key: "jade", label: "Jade", frame: "linear-gradient(#0f6b4c, #0f6b4c)", solid: "#0f6b4c", accent: "#e0a72e"},
    {key: "pine", label: "Pine", frame: "linear-gradient(135deg, #1f3b34 0%, #2c5a4c 100%)", solid: "#1f3b34", accent: "#4fc9a0"},
    {key: "clementine", label: "Clementine", frame: "linear-gradient(#cc3d0a, #cc3d0a)", solid: "#cc3d0a", accent: "#7a2205"},
    {key: "wine", label: "Wine", frame: "linear-gradient(135deg, #a3162b 0%, #3d1544 100%)", solid: "#701638", accent: "#e8a33d"},
    {key: "aubergine", label: "Aubergine", frame: "linear-gradient(#3f0e40, #3f0e40)", solid: "#3f0e40", accent: "#1164a3"},
    {key: "plum", label: "Plum", frame: "linear-gradient(135deg, #4b1a4f 0%, #2c0d31 100%)", solid: "#3c1440", accent: "#8c4bb8"},
    {key: "graphite", label: "Graphite", frame: "linear-gradient(135deg, #2b2f36 0%, #3f4650 100%)", solid: "#2b2f36", accent: "#6c8cff"}
];

// The presets split for the picker: light frames, then dark ones. The caption
// is an i18n key (setting.frame-light / setting.frame-dark).
export function workspaceFrameGroups(): { key: string; presets: WorkspaceFrame[] }[] {
    return [
        {key: "setting.frame-light", presets: WORKSPACE_FRAME_PRESETS.filter(p => p.light)},
        {key: "setting.frame-dark", presets: WORKSPACE_FRAME_PRESETS.filter(p => !p.light)}
    ];
}

export const WORKSPACE_FRAME_KEY = "workspace-frame";

// Inline on <html>, so they beat the skin's own html.workspace / .dark values
const WORKSPACE_FRAME_TOKENS = [
    "--ws-frame-image", "--ws-frame", "--ws-selected-bg",
    // light frames only
    "--ws-fg-rgb", "--ws-frame-deep", "--ws-hover", "--ws-active", "--ws-divider"
];

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
    if (preset.light) {
        // ink foreground; the washes get lighter, a light surface needs less to read as a layer
        el.style.setProperty("--ws-fg-rgb", "0, 0, 0");
        el.style.setProperty("--ws-frame-deep", "rgba(0, 0, 0, 0.05)");
        el.style.setProperty("--ws-hover", "rgba(0, 0, 0, 0.06)");
        el.style.setProperty("--ws-active", "rgba(0, 0, 0, 0.10)");
        el.style.setProperty("--ws-divider", "rgba(0, 0, 0, 0.08)");
    }
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
    const {dark, compact, skin, menuMode, workspaceFrame, customizable, loginLayout, loginBackground, ...colors} = WindowModel.theme || {};
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
    applyHeaderColor(resolveHeaderColor(), toHexColor(color));
    return color;
}
