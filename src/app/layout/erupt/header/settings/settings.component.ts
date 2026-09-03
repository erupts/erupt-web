import {Component, OnInit} from '@angular/core';
import {RTLService, SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {TableSize} from "../../../../build/erupt/model/erupt.enum";
import {WindowModel} from "@shared/model/window.model";
import {applyHeaderColor} from "@shared/util/theme.util";

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

    // Brutalist Theme skin — reflects the class index.html applied before bootstrap.
    brutalistTheme: boolean = document.documentElement.classList.contains("brutalist-theme");

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

    // Dark sidebar in light mode — pure class toggle (styles in tokens.less).
    asideDark: boolean = document.documentElement.classList.contains("aside-dark");

    // Theme color — user choice (localStorage) wins over the site config default.
    // Curated palette: mid-tone (600-level) hues that stay readable under white
    // text and hold up in both light and dark themes.
    presetColors: string[] = [
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
    // brutalist skin is on: pastel accents designed to pair with ink borders
    // and dark text rather than the white-text mid-tones above.
    brutalistPresetColors: string[] = [
        "#fe7da8", // raft pink (site default accent)
        "#f97264", // raft red
        "#f8a16f", // raft orange
        "#ffd441", // raft yellow
        "#a9d877", // raft lime
        "#28ccf3", // raft cyan
        "#bbafe6", // raft purple
        "#c0b9b1"  // raft stone
    ];

    get activePresetColors(): string[] {
        return this.brutalistTheme ? this.brutalistPresetColors : this.presetColors;
    }

    themeColor: string = localStorage.getItem("theme-color") || WindowModel.theme?.primaryColor || "#1677ff";

    setThemeColor(color: string) {
        this.themeColor = color;
        localStorage.setItem("theme-color", color);
        this.nzConfigService.set("theme", {...WindowModel.theme, primaryColor: color});
    }

    resetThemeColor() {
        localStorage.removeItem("theme-color");
        this.themeColor = WindowModel.theme?.primaryColor || "#1677ff";
        this.nzConfigService.set("theme", {...WindowModel.theme, primaryColor: this.themeColor});
    }

    // Header (top bar) color: "" = follow theme, "primary" = theme color, or a literal color.
    headerColor: string = localStorage.getItem("header-color") || "";

    // Preset bar colors: one classic dark plus distinct mid-tone hues —
    // clearly distinguishable at swatch size, all pairing with white text.
    headerPresets: string[] = [
        "#141414", // ink — same surface as the dark sidebar (tokens.less aside-dark)
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

    // <input type="color"> only accepts #rrggbb; the site config may use rgb().
    get themeColorHex(): string {
        const m = this.themeColor.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) {
            return "#" + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, "0")).join("");
        }
        return this.themeColor;
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

    toggleAsideDark(value: boolean) {
        this.asideDark = value;
        localStorage.setItem("aside-dark", String(value));
        document.documentElement.classList.toggle("aside-dark", value);
    }

    toggleBrutalistTheme(value: boolean) {
        this.brutalistTheme = value;
        document.documentElement.classList.toggle("brutalist-theme", value);
        // Persist so the choice survives reload (honored by index.html on next load).
        localStorage.setItem("brutalist-theme", String(value));
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
