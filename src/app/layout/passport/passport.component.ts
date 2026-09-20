import {AfterViewInit, Component} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {EruptTenantInfoData} from "../../build/erupt/model/erupt-tenant";
import {DataService} from "@shared/service/data.service";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {LOGIN_LAYOUT_KEY, LoginLayout, loginLayoutOf} from "@shared/model/login-layout";
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
    // dark / skin / color / layout buttons are then left out of the nav.
    readonly appearanceCustomizable: boolean = WindowModel.appearanceCustomizable();

    // Page layout (LoginLayout): the visitor's own choice first, then the site
    // default, then the centered card.
    readonly LoginLayout = LoginLayout;

    layouts: { value: LoginLayout; icon: string; label: string }[] = [
        {value: LoginLayout.CENTER, icon: "border", label: "login.layout-center"},
        {value: LoginLayout.COVER, icon: "layout", label: "login.layout-cover"},
        {value: LoginLayout.WIDE, icon: "idcard", label: "login.layout-wide"},
        {value: LoginLayout.WALLPAPER, icon: "picture", label: "login.layout-wallpaper"},
        {value: LoginLayout.POSTER, icon: "font-size", label: "login.layout-poster"}
    ];

    // Layouts that show the brand panel (.lp-hero) beside / behind the form
    get heroLayout(): boolean {
        return this.layout === LoginLayout.COVER || this.layout === LoginLayout.POSTER;
    }

    // Site-configured picture (theme.loginBackground): the page artwork in every
    // layout. The wallpaper layout adds the frosted card and falls back to the
    // stock artwork when no picture is configured. The picture is used only once
    // it has actually loaded (see loadWallpaper): a URL that fails — hotlink
    // protection, a typo — would otherwise leave the page with just the vignette.
    wallpaper: string | null = null;

    private loadWallpaper(): void {
        const url = WindowModel.theme?.loginBackground;
        if (!url) {
            return;
        }
        const img = new Image();
        img.onload = () => this.wallpaper = url;
        img.src = url;
    }

    layout: LoginLayout = loginLayoutOf(localStorage.getItem(LOGIN_LAYOUT_KEY))
        || loginLayoutOf(WindowModel.theme?.loginLayout)
        || LoginLayout.CENTER;

    setLayout(value: LoginLayout): void {
        this.layout = value;
        localStorage.setItem(LOGIN_LAYOUT_KEY, value);
    }

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
    // Classic is left out: it only restyles the app's sidebar, so on this page
    // it looks exactly like the default.
    readonly Skin = Skin;

    skins: { value: Skin; label: string }[] = [
        {value: Skin.DEFAULT, label: "Default"},
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
        this.loadWallpaper();
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
