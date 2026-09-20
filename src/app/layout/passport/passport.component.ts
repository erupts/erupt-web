import {AfterViewInit, Component} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {EruptTenantInfoData} from "../../build/erupt/model/erupt-tenant";
import {DataService} from "@shared/service/data.service";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {
    applyThemeColor,
    BRUTALIST_PRESET_COLORS,
    currentSkin,
    resolveThemeColor,
    Skin,
    switchSkin,
    THEME_PRESET_COLORS,
    toHexColor
} from "@shared/util/theme.util";

@Component({
    standalone: false,
    selector: "layout-passport",
    templateUrl: "./passport.component.html",
    styleUrls: ["./passport.component.less"]
})
export class LayoutPassportComponent implements AfterViewInit {

    nowYear = new Date().getFullYear();

    logoPath: string = WindowModel.loginLogoPath;

    desc = WindowModel.desc;

    title = WindowModel.title;

    copyright = WindowModel.copyright;

    copyrightTxt = WindowModel.copyrightTxt;

    tenantDomainInfo = EruptTenantInfoData.get();

    // Site config may lock the appearance (theme.customizable = false): the
    // dark / skin / color buttons are then left out of the nav.
    readonly appearanceCustomizable: boolean = WindowModel.appearanceCustomizable();

    // Dark theme — reflects the class index.html applied before bootstrap.
    darkTheme: boolean = document.documentElement.classList.contains("dark");

    toggleDarkTheme(): void {
        this.darkTheme = !this.darkTheme;
        // Persist an explicit choice (replaces a previous "auto" as well),
        // honored by index.html pre-bootstrap on the next load.
        localStorage.setItem("dark-theme", String(this.darkTheme));
        window["eruptApplyDarkTheme"](this.darkTheme);
    }

    // Visual skin — at most one is active, so it is a single choice rather than a
    // toggle. Reflects the class index.html applied before bootstrap. Kept in
    // step with the settings drawer: same enum, same apply path (theme.util).
    readonly Skin = Skin;

    skins: { value: Skin; label: string }[] = [
        {value: Skin.DEFAULT, label: "Default"},
        {value: Skin.CLASSIC, label: "Classic"},
        {value: Skin.WORKSPACE, label: "Workspace"},
        {value: Skin.LIQUID_GLASS, label: "Liquid Glass"},
        {value: Skin.BRUTALIST, label: "Brutalist"}
    ];

    skin: Skin = currentSkin();

    // Theme color — same palettes, same storage and the same apply path as the
    // settings drawer (@shared/util/theme.util), so a color chosen here is the
    // one the app boots into after signing in.
    // The active skin's own color (the brutalist skin keeps a separate slot)
    themeColor: string = resolveThemeColor();

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

    // Persists too, so the choice survives reload (honored by index.html on next
    // load); the theme color follows the skin's own slot.
    setSkin(value: Skin): void {
        this.skin = value;
        this.themeColor = switchSkin(this.nzConfigService, value);
    }

    constructor(private modalSrv: NzModalService,
                private nzConfigService: NzConfigService) {
        if (WindowModel.copyrightTxt) {
            if (typeof (WindowModel.copyrightTxt) === 'function') {
                this.copyrightTxt = WindowModel.copyrightTxt();
            } else {
                this.copyrightTxt = WindowModel.copyrightTxt;
            }
        }
        if (this.tenantDomainInfo) {
            if (this.tenantDomainInfo.logo) {
                this.logoPath = DataService.previewAttachment(this.tenantDomainInfo.logo)
            }
        }
    }

    ngAfterViewInit(): void {
        this.modalSrv.closeAll();
    }

}
