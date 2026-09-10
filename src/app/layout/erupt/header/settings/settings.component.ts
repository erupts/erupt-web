import {Component, OnInit} from '@angular/core';
import {RTLService, SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {TableSize} from "../../../../build/erupt/model/erupt.enum";
import {WindowModel} from "@shared/model/window.model";
import {
    applyHeaderColor,
    applyThemeColor,
    BRUTALIST_PRESET_COLORS,
    DEFAULT_THEME_COLOR,
    THEME_PRESET_COLORS,
    toHexColor
} from "@shared/util/theme.util";

type Skin = 'default' | 'brutalist' | 'liquid-glass';

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
    skin: Skin = document.documentElement.classList.contains("brutalist-theme")
        ? "brutalist"
        : document.documentElement.classList.contains("liquid-glass")
            ? "liquid-glass"
            : "default";

    get brutalistTheme(): boolean {
        return this.skin === "brutalist";
    }

    // Color scheme: light / dark / auto (follow the OS). index.html applied the
    // saved choice before bootstrap; here we only reflect and update it.
    darkMode: 'light' | 'dark' | 'auto' = (() => {
        const pref = localStorage.getItem("dark-theme");
        if (pref === "auto") return "auto";
        if (pref === "true") return "dark";
        if (pref === "false") return "light";
        // no saved choice — reflect the site-config default already applied
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

    themeColor: string = localStorage.getItem("theme-color") || WindowModel.theme?.primaryColor || DEFAULT_THEME_COLOR;

    setThemeColor(color: string) {
        this.themeColor = applyThemeColor(this.nzConfigService, color);
    }

    resetThemeColor() {
        this.themeColor = applyThemeColor(this.nzConfigService, null);
    }

    // Header (top bar) color: "" = follow theme, "primary" = theme color, or a literal color.
    headerColor: string = localStorage.getItem("header-color") || "";

    // Preset bar colors: one classic dark plus distinct mid-tone hues —
    // clearly distinguishable at swatch size, all pairing with white text.
    headerPresets: string[] = [
        "#141414", // ink
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
        // Empty = back to the site default (theme.headerColor, or follow the theme)
        applyHeaderColor(value || WindowModel.theme?.headerColor || null);
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

    // Both flags are still written on every change: index.html reads them
    // pre-bootstrap, and eruptSiteConfig.brutalistTheme / .liquidGlass remain
    // the documented site-config switches, so the storage contract is unchanged.
    setSkin(value: Skin) {
        this.skin = value;
        const root = document.documentElement;
        root.classList.toggle("brutalist-theme", value === "brutalist");
        root.classList.toggle("liquid-glass", value === "liquid-glass");
        localStorage.setItem("brutalist-theme", String(value === "brutalist"));
        localStorage.setItem("liquid-glass", String(value === "liquid-glass"));
    }

    setLayout(name: string, value: any) {
        this.settingSrv.setLayout(name, value);
    }

    // Menu layout mode radio: normal single-column, split (top-level tabs in the
    // header) or dual-column (first-level rail inside the sidebar). Split mode
    // replaces the header breadcrumbs with the category tabs.
    get menuMode(): 'normal' | 'split' | 'dual' {
        if (this.layout['splitMenu']) return 'split';
        if (this.layout['dualMenu']) return 'dual';
        return 'normal';
    }

    setMenuMode(mode: 'normal' | 'split' | 'dual') {
        if (mode === 'split') {
            this.settingSrv.setLayout('breadcrumbs', false);
        } else if (this.layout['splitMenu']) {
            // restore breadcrumbs only when leaving split mode
            this.settingSrv.setLayout('breadcrumbs', true);
        }
        this.settingSrv.setLayout('splitMenu', mode === 'split');
        this.settingSrv.setLayout('dualMenu', mode === 'dual');
    }

    toggleBreadcrumbs(value: boolean) {
        if (value) this.settingSrv.setLayout('splitMenu', false);
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
