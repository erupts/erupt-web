import {AfterViewInit, Component} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {EruptTenantInfoData} from "../../build/erupt/model/erupt-tenant";
import {DataService} from "@shared/service/data.service";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {
    applyThemeColor,
    BRUTALIST_PRESET_COLORS,
    DEFAULT_THEME_COLOR,
    THEME_PRESET_COLORS,
    toHexColor
} from "@shared/util/theme.util";

type PassportSkin = 'default' | 'brutalist' | 'liquid-glass';

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
    // step with the settings drawer: same values, same two storage flags.
    skins: { value: PassportSkin; label: string }[] = [
        {value: "default", label: "Default"},
        {value: "brutalist", label: "Brutalist"},
        {value: "liquid-glass", label: "Liquid Glass"}
    ];

    skin: PassportSkin = document.documentElement.classList.contains("brutalist-theme")
        ? "brutalist"
        : document.documentElement.classList.contains("liquid-glass")
            ? "liquid-glass"
            : "default";

    // Theme color — same palettes, same storage and the same apply path as the
    // settings drawer (@shared/util/theme.util), so a color chosen here is the
    // one the app boots into after signing in.
    themeColor: string = localStorage.getItem("theme-color") || WindowModel.theme?.primaryColor || DEFAULT_THEME_COLOR;

    get activePresetColors(): string[] {
        return this.skin === "brutalist" ? BRUTALIST_PRESET_COLORS : THEME_PRESET_COLORS;
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

    setSkin(value: PassportSkin): void {
        this.skin = value;
        const root = document.documentElement;
        root.classList.toggle("brutalist-theme", value === "brutalist");
        root.classList.toggle("liquid-glass", value === "liquid-glass");
        // Persist so the choice survives reload (honored by index.html on next load).
        localStorage.setItem("brutalist-theme", String(value === "brutalist"));
        localStorage.setItem("liquid-glass", String(value === "liquid-glass"));
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
