import {AfterViewInit, Component, OnDestroy, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";
import {DataService} from "@shared/service/data.service";
import {SessionService} from "@shared/service/session.service";
import {EruptApiModel, Status} from "../../../../build/erupt/model/erupt-api.model";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {WindowModel} from "@shared/model/window.model";
import {
    applyThemeColor,
    BRUTALIST_PRESET_COLORS,
    currentSkin,
    resolveThemeColor,
    Skin,
    SkinOption,
    SKINS,
    switchSkin,
    THEME_PRESET_COLORS,
    toHexColor
} from "@shared/util/theme.util";

// The inline pickers under the appearance pill
export enum LockPanel {
    SKIN = "skin",
    COLOR = "color"
}

// Full-window cover shown while the session is locked; the page underneath stays mounted
@Component({
    standalone: false,
    selector: "lock-screen",
    templateUrl: "./lock-screen.component.html",
    styleUrls: ["./lock-screen.component.less"]
})
export class LockScreenComponent implements OnInit, AfterViewInit, OnDestroy {

    pwd = "";

    error = "";

    loading = false;

    now = new Date();

    // ── Appearance ──
    // The cover sits above the CDK overlay container, so every picker here is
    // inline (no dropdown / tooltip): a corner pill with the dark toggle and a
    // swatch panel that unfolds beneath it.

    // Reflects the class index.html applied before bootstrap
    darkTheme: boolean = document.documentElement.classList.contains("dark");

    // Theme color is branding: hidden when the site config locks the appearance
    readonly appearanceCustomizable: boolean = WindowModel.appearanceCustomizable();

    // Which inline panel is unfolded under the pill, if any
    panel: LockPanel | null = null;

    readonly LockPanel = LockPanel;

    // Visual skin: a single choice, reflecting the class index.html applied before bootstrap
    readonly Skin = Skin;

    skins: SkinOption[] = SKINS;

    skin: Skin = currentSkin();

    // The active skin's own color (the brutalist skin keeps a separate slot)
    themeColor: string = resolveThemeColor();

    private clock: ReturnType<typeof setInterval>;

    constructor(public settings: SettingsService,
                private dataService: DataService,
                private nzConfigService: NzConfigService,
                public session: SessionService) {
    }

    toggleDarkTheme(): void {
        this.darkTheme = !this.darkTheme;
        // An explicit choice replaces a previous "auto" as well; index.html honors it on the next load
        localStorage.setItem("dark-theme", String(this.darkTheme));
        window["eruptApplyDarkTheme"](this.darkTheme);
    }

    togglePanel(panel: LockPanel): void {
        this.panel = this.panel === panel ? null : panel;
    }

    // The theme color follows the skin's own slot (entering brutalist brings its pastel)
    setSkin(value: Skin): void {
        this.skin = value;
        this.themeColor = switchSkin(this.nzConfigService, value);
    }

    get activePresetColors(): string[] {
        return this.skin === Skin.BRUTALIST ? BRUTALIST_PRESET_COLORS : THEME_PRESET_COLORS;
    }

    get themeColorHex(): string {
        return toHexColor(this.themeColor);
    }

    setThemeColor(color: string): void {
        this.themeColor = applyThemeColor(this.nzConfigService, color);
    }

    resetThemeColor(): void {
        this.themeColor = applyThemeColor(this.nzConfigService, null);
    }

    ngOnInit() {
        this.clock = setInterval(() => this.now = new Date(), 1000);
    }

    // The cover tints the top strip too: the installed app's title bar corners follow it
    // (index.html reads .lock-screen as one more mask), on the way in and on the way out
    ngAfterViewInit() {
        window["eruptSyncThemeColor"]?.();
    }

    ngOnDestroy() {
        clearInterval(this.clock);
        window["eruptSyncThemeColor"]?.();
    }

    unlock() {
        if (!this.pwd || this.loading) return;
        this.loading = true;
        this.error = "";
        // a refused check arrives as a normal body, or as the interceptor's rejection: same handling
        const refused = (api: EruptApiModel) => {
            this.loading = false;
            this.error = api?.message || "";
            this.pwd = "";
        };
        this.dataService.verifyPwd(this.pwd).subscribe({
            next: api => api.status === Status.SUCCESS ? this.session.unlock() : refused(api),
            error: refused
        });
    }

}
