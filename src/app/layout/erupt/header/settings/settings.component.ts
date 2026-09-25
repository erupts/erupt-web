import {Component, OnInit} from '@angular/core';
import {RTLService, SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {TableSize} from "../../../../build/erupt/model/erupt.enum";
import {WindowModel} from "@shared/model/window.model";
import {isHeaderMenuMode, MenuMode, menuModeFlags, menuModeOf} from "@shared/model/erupt-menu";
import {FORM_PANEL_MODE_KEY, FormPanelMode, formPanelModeOf} from "@shared/model/form-panel";
import {
    applyHeaderColor,
    applyThemeColor,
    applyWorkspaceFrame,
    WORKSPACE_FRAME_PRESETS,
    BRUTALIST_PRESET_COLORS,
    currentSkin,
    resolveHeaderColor, resolveThemeColor,
    savedWorkspaceFrame,
    Skin,
    switchSkin,
    THEME_PRESET_COLORS,
    toHexColor,
    WorkspaceFrame,
    workspaceFrameGroups
} from "@shared/util/theme.util";

@Component({
    standalone: false,
    selector: 'erupt-settings',
    templateUrl: './settings.component.html',
    styleUrls: ["./settings.component.less"],
    styles: []
})
export class SettingsComponent implements OnInit {

    constructor(private settingSrv: SettingsService,
                private confirmServ: NzModalService,
                private messageServ: NzMessageService,
                private i18n: I18NService,
                private reuseTabService: ReuseTabService,
                private nzConfigService: NzConfigService,
                public rtl: RTLService) {
    }

    // Visual skin layered over the light/dark theme — at most one is active, so
    // it is a single choice rather than independent toggles. Reflects the class
    // index.html applied before bootstrap.
    readonly Skin = Skin;

    // Site config may lock the appearance (theme.customizable = false): the
    // whole appearance group is then left out of the drawer.
    readonly appearanceCustomizable: boolean = WindowModel.appearanceCustomizable();

    skin: Skin = currentSkin();

    get brutalistTheme(): boolean {
        return this.skin === Skin.BRUTALIST;
    }

    // Workspace skin: the frame gradient. null = derived from the theme color
    // (the site default, if one is configured, is applied by startup.service).
    workspaceFrameGroups: { key: string; presets: WorkspaceFrame[] }[] = workspaceFrameGroups();

    workspaceFrame: string | null = savedWorkspaceFrame();

    // Swatch for the derived frame — the same mix as workspace.less, live
    readonly autoWorkspaceFrame = "color-mix(in srgb, var(--ant-primary-color) 42%, #151a26)";

    // A preset brings its accent along as the theme color, so the frame and the
    // controls on the content card share one palette in a single click. Clearing
    // the preset keeps the current theme color: the derived frame then follows it.
    setWorkspaceFrame(key: string | null) {
        this.workspaceFrame = key;
        if (key) {
            applyWorkspaceFrame(key);
            const preset = WORKSPACE_FRAME_PRESETS.find(p => p.key === key);
            if (preset) {
                this.setThemeColor(preset.accent);
            }
        } else {
            // clear the saved choice, then fall back to the site default
            applyWorkspaceFrame(null);
            applyWorkspaceFrame(WindowModel.theme?.workspaceFrame || null, false);
        }
    }

    // Color scheme: light / dark / auto (follow the OS). index.html applied the
    // saved choice before bootstrap; here we only reflect and update it.
    darkMode: 'light' | 'dark' | 'auto' = (() => {
        const pref = localStorage.getItem("dark-theme");
        if (pref === "auto") return "auto";
        if (pref === "true") return "dark";
        if (pref === "false") return "light";
        // no saved choice — reflect the site-config default already applied by index.html
        if (WindowModel.theme?.dark === "auto") return "auto";
        return document.documentElement.classList.contains("dark") ? "dark" : "light";
    })();

    // Compact theme — reflects the class index.html applied before bootstrap.
    compactTheme: boolean = document.documentElement.classList.contains("compact");

    // Palettes live in @shared/util/theme.util so this drawer and the login
    // page picker can never drift apart.
    presetColors: string[] = THEME_PRESET_COLORS;

    brutalistPresetColors: string[] = BRUTALIST_PRESET_COLORS;

    get activePresetColors(): string[] {
        return this.brutalistTheme ? this.brutalistPresetColors : this.presetColors;
    }

    // The active skin's own color (the brutalist skin keeps a separate slot)
    themeColor: string = resolveThemeColor();

    setThemeColor(color: string) {
        this.themeColor = applyThemeColor(this.nzConfigService, color);
        this.refreshHeaderColor();
    }

    resetThemeColor() {
        this.themeColor = applyThemeColor(this.nzConfigService, null);
        this.refreshHeaderColor();
    }

    // Re-resolve the top bar whenever what it follows can have changed: the
    // theme color it may be tracking, or the skin that decides whether it
    // tracks at all. The resolved theme color is passed explicitly because
    // ng-zorro has not written --ant-primary-color yet at this point.
    private refreshHeaderColor() {
        applyHeaderColor(resolveHeaderColor(), toHexColor(this.themeColor));
    }

    // Header (top bar) color: "" = follow theme, "primary" = theme color, or a literal color.
    headerColor: string = localStorage.getItem("header-color") || "";

    // Preset bar colors: one classic dark plus distinct mid-tone hues —
    // clearly distinguishable at swatch size, all pairing with white text.
    headerPresets: string[] = [
        "#141414", // ink
        "#001529", // pro navy — the Ant Design Pro dark header
        "#2c3e50", // midnight — desaturated blue-gray, softer than ink
        "#2563eb", // sapphire blue
        "#0d9488", // teal
        "#7c3aed", // violet
        "#64748b"  // misty slate
    ];

    setHeaderColor(value: string) {
        this.headerColor = value;
        if (value) {
            localStorage.setItem("header-color", value);
        } else {
            localStorage.removeItem("header-color");
        }
        // Empty = back to the site default (theme.headerColor), then to whatever
        // the active skin defaults to (the brutalist band follows the theme color)
        this.refreshHeaderColor();
    }

    get themeColorHex(): string {
        return toHexColor(this.themeColor);
    }

    ngOnInit() {
        if (!this.settingSrv.layout['tableSize']) {
            this.settingSrv.setLayout('tableSize', TableSize.SMALL);
        }
    }

    setDarkMode(mode: 'light' | 'dark' | 'auto') {
        this.darkMode = mode;
        // Persisted as "true" | "false" | "auto"; index.html honors it on load
        // and follows OS scheme changes while in auto mode.
        localStorage.setItem("dark-theme", mode === "auto" ? "auto" : String(mode === "dark"));
        const dark = mode === "auto"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : mode === "dark";
        window["eruptApplyDarkTheme"](dark);
    }

    toggleCompactTheme(value: boolean) {
        this.compactTheme = value;
        localStorage.setItem("compact-theme", String(value));
        window["eruptApplyCompactTheme"](value);
    }

    // Entering the brutalist skin brings its own pastel accent (last one picked
    // there, else signal yellow); leaving it restores the normal theme color.
    setSkin(value: Skin) {
        this.skin = value;
        this.themeColor = switchSkin(this.nzConfigService, value);
    }

    setLayout(name: string, value: any) {
        this.settingSrv.setLayout(name, value);
    }

    // How record forms open (FormPanelMode); the modal title bar changes it too, so read live.
    readonly FormPanelMode = FormPanelMode;

    get formPanelMode(): FormPanelMode {
        return formPanelModeOf(this.settingSrv.layout);
    }

    setFormPanelMode(mode: FormPanelMode) {
        this.settingSrv.setLayout(FORM_PANEL_MODE_KEY, mode);
    }

    // Menu layout mode radio (see MenuMode). Split and top modes take the header
    // space, so they replace the breadcrumbs.
    readonly MenuMode = MenuMode;

    get menuMode(): MenuMode {
        return menuModeOf(this.layout);
    }

    // Two-way bound by the dual-mode sub-switch. Stored as a layout flag, but
    // the switch needs a real boolean: an unset flag means "never chosen", and
    // the rail is icon-only by default, so it reads back as false.
    get dualRailText(): boolean {
        return this.layout['dualRailText'] === true;
    }

    set dualRailText(value: boolean) {
        this.layout['dualRailText'] = value;
    }

    setMenuMode(mode: MenuMode) {
        if (isHeaderMenuMode(mode)) {
            this.settingSrv.setLayout('breadcrumbs', false);
        } else if (isHeaderMenuMode(this.menuMode)) {
            // restore breadcrumbs only when leaving a header-menu mode
            this.settingSrv.setLayout('breadcrumbs', true);
        }
        for (const [flag, on] of Object.entries(menuModeFlags(mode))) {
            this.settingSrv.setLayout(flag, on);
        }
    }

    toggleBreadcrumbs(value: boolean) {
        if (value) {
            // breadcrumbs and a header menu cannot share the bar
            this.settingSrv.setLayout('splitMenu', false);
            this.settingSrv.setLayout('topMenu', false);
        }
        this.settingSrv.setLayout('breadcrumbs', value);
    }

    get layout() {
        return this.settingSrv.layout;
    }

    changeReuse(value: boolean) {
        if (value) {
            this.reuseTabService.mode = 0;
            this.reuseTabService.excludes = [];
        } else {
            this.reuseTabService.mode = 2;
            this.reuseTabService.excludes = [/\d*/];
        }
        this.settingSrv.setLayout('reuse', value);
    }

    toggleColorWeak(value: boolean) {
        if (value) this.toggleColorGray(false);
        this.settingSrv.setLayout("colorWeak", value)
        if (value) {
            document.documentElement.classList.add("color-weak");
        } else {
            document.documentElement.classList.remove("color-weak");
        }
    }

    toggleColorGray(value: boolean) {
        if (value) this.toggleColorWeak(false);
        this.settingSrv.setLayout("colorGray", value)
        if (value) {
            document.documentElement.classList.add("color-gray");
        } else {
            document.documentElement.classList.remove("color-gray");
        }
    }

    clear() {
        this.confirmServ.confirm({
            nzTitle: this.i18n.fanyi("setting.confirm"),
            nzOnOk: () => {
                const token = localStorage.getItem('_token');
                localStorage.clear();
                if (token) localStorage.setItem('_token', token);
                this.messageServ.success(this.i18n.fanyi("finish"));
                setTimeout(() => location.reload(), 500);
            }
        });
    }

}
