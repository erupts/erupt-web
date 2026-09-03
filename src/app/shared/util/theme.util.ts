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
    "--erupt-header-border"
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
    } else {
        // Light custom bar — ink foreground, translucent-black states
        el.style.setProperty("--erupt-header-text", "rgba(0, 0, 0, 0.88)");
        el.style.setProperty("--erupt-header-text-secondary", "rgba(0, 0, 0, 0.65)");
        el.style.setProperty("--erupt-header-fill", "rgba(0, 0, 0, 0.06)");
        el.style.setProperty("--erupt-header-fill-strong", "rgba(0, 0, 0, 0.11)");
        el.style.setProperty("--erupt-header-active-bg", "rgba(0, 0, 0, 0.08)");
        el.style.setProperty("--erupt-header-active-text", "rgba(0, 0, 0, 0.88)");
        el.style.setProperty("--erupt-header-border", "rgba(0, 0, 0, 0.1)");
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
