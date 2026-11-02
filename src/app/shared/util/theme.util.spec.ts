import {
    applyHeaderColor,
    applySkin,
    applyWorkspaceFrame,
    BRUTALIST_DEFAULT_COLOR,
    BRUTALIST_PRESET_COLORS,
    currentSkin,
    DEFAULT_THEME_COLOR,
    headerColorLocked,
    isDarkColor,
    resolveHeaderColor,
    resolveThemeColor,
    savedWorkspaceFrame,
    Skin,
    skinPresetColors,
    TERMINAL_DEFAULT_COLOR,
    THEME_PRESET_COLORS,
    themeColorStorageKey,
    toHexColor,
    WORKSPACE_FRAME_KEY,
    WORKSPACE_FRAME_PRESETS,
    workspaceFrameGroups
} from "@shared/util/theme.util";
import {WindowModel} from "@shared/model/window.model";

const html = document.documentElement;

describe("theme.util", () => {

    beforeEach(() => {
        localStorage.clear();
        html.className = "";
        html.removeAttribute("style");
        WindowModel.theme = {};
    });

    describe("isDarkColor", () => {
        it.each([
            ["#000", true],
            ["#000000", true],
            ["#1677ff", true],
            ["#fff", false],
            ["#FFFFFF", false],
            ["#ffd440", false],
            ["rgb(0, 0, 0)", true],
            ["rgba(255, 255, 255, 0.5)", false],
            ["rgb(255 212 64)", false]
        ])("%s → dark=%s", (color, dark) => {
            expect(isDarkColor(color)).toBe(dark);
        });

        it("treats unparseable colors as dark so the bar keeps white text", () => {
            expect(isDarkColor("var(--ant-primary-color)")).toBe(true);
            expect(isDarkColor("tomato")).toBe(true);
        });
    });

    describe("toHexColor", () => {
        it("converts rgb() and rgba() to #rrggbb", () => {
            expect(toHexColor("rgb(22, 119, 255)")).toBe("#1677ff");
            expect(toHexColor("rgba(0, 5, 255, 0.4)")).toBe("#0005ff");
        });

        it("passes other values through", () => {
            expect(toHexColor("#abcdef")).toBe("#abcdef");
        });
    });

    describe("skins", () => {
        it("defaults to the default skin when no class is set", () => {
            expect(currentSkin()).toBe(Skin.DEFAULT);
        });

        it("applySkin sets exactly one class and writes every flag", () => {
            applySkin(Skin.TERMINAL);
            expect(currentSkin()).toBe(Skin.TERMINAL);
            expect(html.classList.contains("terminal")).toBe(true);
            expect(localStorage.getItem("terminal")).toBe("true");
            expect(localStorage.getItem("brutalist-theme")).toBe("false");

            applySkin(Skin.BRUTALIST);
            expect(currentSkin()).toBe(Skin.BRUTALIST);
            expect(html.classList.contains("terminal")).toBe(false);
            expect(localStorage.getItem("terminal")).toBe("false");
            expect(localStorage.getItem("brutalist-theme")).toBe("true");

            applySkin(Skin.DEFAULT);
            expect(currentSkin()).toBe(Skin.DEFAULT);
            expect(html.className).toBe("");
        });

        it("locks the header color only for skins whose bar is part of their language", () => {
            expect(headerColorLocked(Skin.BRUTALIST)).toBe(true);
            expect(headerColorLocked(Skin.TERMINAL)).toBe(true);
            expect(headerColorLocked(Skin.DEFAULT)).toBe(false);
            expect(headerColorLocked(Skin.WORKSPACE)).toBe(false);
        });

        it("offers each skin its own palette", () => {
            expect(skinPresetColors(Skin.BRUTALIST)).toBe(BRUTALIST_PRESET_COLORS);
            expect(skinPresetColors(Skin.MATERIAL)).toBe(THEME_PRESET_COLORS);
        });
    });

    describe("resolveHeaderColor", () => {
        it("prefers the user's choice over the site default", () => {
            WindowModel.theme = {headerColor: "#222"};
            expect(resolveHeaderColor()).toBe("#222");
            localStorage.setItem("header-color", "primary");
            expect(resolveHeaderColor()).toBe("primary");
        });

        it("returns null when nothing is configured", () => {
            expect(resolveHeaderColor()).toBeNull();
        });

        it("pins brutalist to primary and terminal to none, ignoring a saved choice", () => {
            localStorage.setItem("header-color", "#123456");
            applySkin(Skin.BRUTALIST);
            expect(resolveHeaderColor()).toBe("primary");
            applySkin(Skin.TERMINAL);
            expect(resolveHeaderColor()).toBeNull();
            // the choice survives for the other skins
            applySkin(Skin.DEFAULT);
            expect(resolveHeaderColor()).toBe("#123456");
        });
    });

    describe("resolveThemeColor", () => {
        it("falls back from the saved color to the site default to the built-in default", () => {
            expect(resolveThemeColor()).toBe(DEFAULT_THEME_COLOR);
            WindowModel.theme = {primaryColor: "#7c3aed"};
            expect(resolveThemeColor()).toBe("#7c3aed");
            localStorage.setItem("theme-color", "#059669");
            expect(resolveThemeColor()).toBe("#059669");
        });

        it("keeps a separate slot per palette skin", () => {
            localStorage.setItem("theme-color", "#059669");
            WindowModel.theme = {primaryColor: "#7c3aed"};

            applySkin(Skin.BRUTALIST);
            expect(themeColorStorageKey()).toBe("theme-color-brutalist");
            // the skin default wins over the site color, which is meant for white text
            expect(resolveThemeColor()).toBe(BRUTALIST_DEFAULT_COLOR);

            applySkin(Skin.TERMINAL);
            localStorage.setItem("theme-color-terminal", "#00e5ff");
            expect(resolveThemeColor()).toBe("#00e5ff");
            localStorage.removeItem("theme-color-terminal");
            expect(resolveThemeColor()).toBe(TERMINAL_DEFAULT_COLOR);

            applySkin(Skin.WORKSPACE);
            expect(themeColorStorageKey()).toBe("theme-color");
            expect(resolveThemeColor()).toBe("#059669");
        });
    });

    describe("applyHeaderColor", () => {
        afterEach(() => {
            delete (window as any).eruptSyncThemeColor;
        });

        it("uses white foreground on a dark bar", () => {
            applyHeaderColor("#1d3557");
            expect(html.style.getPropertyValue("--erupt-header-bg")).toBe("#1d3557");
            expect(html.style.getPropertyValue("--erupt-header-text")).toBe("rgba(255, 255, 255, 0.95)");
            expect(html.style.getPropertyValue("--erupt-header-progress")).toBe("#fff");
        });

        it("uses ink foreground on a light bar", () => {
            applyHeaderColor("#ffe98a");
            expect(html.style.getPropertyValue("--erupt-header-text")).toBe("rgba(0, 0, 0, 0.88)");
        });

        it("follows the resolved theme color for primary", () => {
            applyHeaderColor("primary", "#ffd440");
            expect(html.style.getPropertyValue("--erupt-header-bg")).toBe("var(--ant-primary-color)");
            expect(html.style.getPropertyValue("--erupt-header-text")).toBe("rgba(0, 0, 0, 0.88)");
        });

        it("clears every token for null and still syncs the browser chrome", () => {
            const sync = vi.fn();
            (window as any).eruptSyncThemeColor = sync;
            applyHeaderColor("#1d3557");
            applyHeaderColor(null);
            expect(html.style.getPropertyValue("--erupt-header-bg")).toBe("");
            expect(html.style.getPropertyValue("--erupt-header-text")).toBe("");
            expect(sync).toHaveBeenCalledTimes(2);
        });
    });

    describe("workspace frame", () => {
        it("groups presets into light then dark with nothing lost", () => {
            const [light, dark] = workspaceFrameGroups();
            expect(light.presets.every(p => p.light)).toBe(true);
            expect(dark.presets.some(p => p.light)).toBe(false);
            expect(light.presets.length + dark.presets.length).toBe(WORKSPACE_FRAME_PRESETS.length);
        });

        it("has unique preset keys", () => {
            const keys = WORKSPACE_FRAME_PRESETS.map(p => p.key);
            expect(new Set(keys).size).toBe(keys.length);
        });

        it("persists the preset without its label so index.html can paint the preloader", () => {
            applyWorkspaceFrame("mint");
            const stored = JSON.parse(localStorage.getItem(WORKSPACE_FRAME_KEY));
            expect(stored.key).toBe("mint");
            expect(stored.label).toBeUndefined();
            expect(stored.frame).toContain("gradient");
            expect(savedWorkspaceFrame()).toBe("mint");
            // a light frame flips the chrome foreground to ink
            expect(html.style.getPropertyValue("--ws-fg-rgb")).toBe("0, 0, 0");
        });

        it("does not set light-only tokens for a dark frame", () => {
            applyWorkspaceFrame("mint");
            applyWorkspaceFrame("graphite");
            expect(html.style.getPropertyValue("--ws-frame")).toBe("#2b2f36");
            expect(html.style.getPropertyValue("--ws-fg-rgb")).toBe("");
        });

        it("applies without persisting when the site default is applied at startup", () => {
            applyWorkspaceFrame("sky", false);
            expect(localStorage.getItem(WORKSPACE_FRAME_KEY)).toBeNull();
            expect(html.style.getPropertyValue("--ws-selected-bg")).toBe("#3370ff");
        });

        it("clears the saved preset and the tokens for null or an unknown key", () => {
            applyWorkspaceFrame("mint");
            applyWorkspaceFrame(null);
            expect(localStorage.getItem(WORKSPACE_FRAME_KEY)).toBeNull();
            expect(html.style.getPropertyValue("--ws-frame")).toBe("");
            applyWorkspaceFrame("no-such-frame");
            expect(html.style.getPropertyValue("--ws-frame")).toBe("");
        });

        it("reads a corrupt saved value as none", () => {
            localStorage.setItem(WORKSPACE_FRAME_KEY, "{not json");
            expect(savedWorkspaceFrame()).toBeNull();
        });
    });
});
