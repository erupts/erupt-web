import {SiteConfig, SiteLink} from "@shared/model/erupt-app.model";
import {MapConfig, MapProvider} from "@shared/model/map.model";

export class WindowModel {

    public static VIS_TPL_DATA_KEY: string = "visTplData";

    public static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] ? WindowModel.config["domain"] + "/" : '';

    // Attachment host. The backend AttachmentProxy is the source of truth (delivered through
    // /erupt-app at startup); eruptSiteConfig.fileDomain remains as an explicit override.
    public static fileDomain: string = WindowModel.config["fileDomain"] || undefined;

    // Adopt the backend attachment host unless the site config already pins one. Written back
    // into the site config so embedded pages that read eruptSiteConfig (home.html) see it too.
    public static applyFileDomain(fileDomain: string | null | undefined) {
        if (fileDomain && !WindowModel.config["fileDomain"]) {
            WindowModel.config["fileDomain"] = fileDomain;
            WindowModel.fileDomain = fileDomain;
        }
    }

    // Site settings saved in the admin UI (System Management > Site Settings), delivered by
    // /erupt-app as a patch: only the keys an administrator filled in. They supplement app.js
    // rather than replace it — a saved key wins, every other key keeps its app.js value. Image
    // keys arrive as attachment paths and are resolved to URLs here. Returns whether anything
    // was applied, so the caller knows to re-run init().
    public static applySite(site: SiteConfig | null | undefined): boolean {
        if (!site || !Object.keys(site).length) {
            return false;
        }
        // "app" overrides /erupt-app properties (watermark) and is applied by the startup service
        const {theme, app, pwa, ...brand} = site;
        for (const key of ["logoPath", "logoFoldPath", "loginLogoPath", "faviconPath"]) {
            if (brand[key]) brand[key] = WindowModel.assetUrl(brand[key]);
        }
        Object.assign(WindowModel.config, brand);
        if (pwa) {
            // merged, so the app.js shortcuts stay
            WindowModel.config["pwa"] = {...(WindowModel.config["pwa"] || {}), icon: pwa.icon ? WindowModel.assetUrl(pwa.icon) : undefined};
        }
        if (theme) {
            if (theme.loginBackground) theme.loginBackground = WindowModel.assetUrl(theme.loginBackground);
            WindowModel.config["theme"] = {...(WindowModel.config["theme"] || {}), ...theme};
        }
        return true;
    }

    // An uploaded attachment path as a URL; absolute and data URLs pass through. Attachments are
    // served without a session, so no token is appended (the login page has none to give).
    private static assetUrl(path: string): string {
        if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) {
            return path;
        }
        return (WindowModel.fileDomain || WindowModel.domain + "erupt-attachment") + path;
    }

    // eruptSiteConfig.map — the map vendor and its key (MapService loads that vendor's SDK on demand)
    public static map: MapConfig;

    public static title: string;

    public static desc: string;

    public static logoPath: string;

    public static logoFoldPath: string;

    public static loginLogoPath: string;

    public static logoText: string;

    public static registerPage: string; //registration page URL

    public static copyright: boolean;

    public static copyrightTxt: any; //license text

    // Site settings: plain footer text replacing the default copyright line and the login
    // notice, already filtered by its time window
    public static footerText: string;

    public static loginNotice: string;

    // Site settings: header links, default language
    public static siteLinks: SiteLink[] = [];

    public static defaultLang: string;

    // Site settings on the login page: policy links, whether ticking them is required, and the
    // maintenance text while maintenance mode is on
    public static privacyUrl: string;

    public static termsUrl: string;

    public static requireConsent: boolean;

    public static maintenance: string;

    // eruptSiteConfig.theme — appearance defaults. Every entry applies only while the
    // user has no saved choice in the settings drawer.
    public static theme: {
        // false locks the branding side of the appearance (colors, skin, navigation
        // gradient, menu mode): the user-facing controls are hidden and saved user
        // choices are ignored (index.html purges those keys on load, startup.service
        // forces menuMode). Light/dark and compact stay per-user.
        customizable?: boolean,
        primaryColor?: string,
        // Header bar color: "primary" (follow the primary color) or a literal
        // CSS color; users can still override it in the settings drawer.
        headerColor?: string,
        // false | true | "auto" (follow the OS color scheme)
        dark?: boolean | "auto",
        compact?: boolean,
        // "default" | "brutalist" | "liquid-glass" | "workspace" | "classic" | "terminal" | "material" | "polaris" | "linear" (Skin in @shared/util/theme.util)
        skin?: string,
        // Workspace skin only: a frame gradient preset key (WORKSPACE_FRAME_PRESETS in
        // @shared/util/theme.util); unset = the frame is derived from the primary color
        workspaceFrame?: string,
        // "normal" | "split" | "dual" | "top" | "group" | "top-split" (MenuMode)
        menuMode?: string,
        // false hides the sidebar's section titles by module group (business, AI, dev tools, ops)
        menuGroups?: boolean,
        // "center" | "side" | "full" (FormPanelMode): how record forms open
        formPanelMode?: string,
        // "center" | "cover" | "wide" | "wallpaper" | "poster" (LoginLayout): the login page layout
        loginLayout?: string,
        // login page picture URL: replaces the stock artwork in every layout
        loginBackground?: string,
        [key: string]: any
    }

    // Whether users may change the appearance themselves (theme.customizable, default true)
    public static appearanceCustomizable(): boolean {
        return WindowModel.theme?.customizable !== false;
    }

    public static r_tools: CustomerTool[];

    public static userTools: UserTool[];

    public static upload: Function;

    // A logo key that is missing falls back; one set to null or '' hides the logo.
    private static resolveLogo(configured: string | null | undefined, fallback: string | null): string | null {
        if (configured === undefined) {
            return fallback;
        }
        return configured || null;
    }

    public static init() {
        WindowModel.r_tools = WindowModel.config["r_tools"] || [];
        WindowModel.userTools = WindowModel.config["userTools"] || [];
        // the legacy top-level amapKey / amapSecurityJsCode still configure the amap vendor
        WindowModel.map = {
            provider: MapProvider.AMAP,
            key: WindowModel.config["amapKey"],
            securityJsCode: WindowModel.config["amapSecurityJsCode"],
            ...(WindowModel.config["map"] || {})
        };
        WindowModel.title = WindowModel.config["title"] === null ? 'Erupt Engine' : WindowModel.config["title"];
        WindowModel.desc = WindowModel.config["desc"] || undefined;
        // Logo keys: leaving one out means the default, setting it to null or ''
        // means "show nothing there".
        WindowModel.logoPath = WindowModel.resolveLogo(WindowModel.config["logoPath"], "assets/logo.svg");
        // Collapsed brand mark: follows whatever the expanded header shows, so
        // collapsing never swaps the logo for something else. When there is no
        // expanded logo the header draws the site's initial instead.
        WindowModel.logoFoldPath = WindowModel.resolveLogo(WindowModel.config["logoFoldPath"], WindowModel.logoPath);
        WindowModel.loginLogoPath = WindowModel.resolveLogo(WindowModel.config["loginLogoPath"], WindowModel.logoPath);
        WindowModel.logoText = WindowModel.config["logoText"] || WindowModel.title;
        WindowModel.registerPage = WindowModel.config["registerPage"] || undefined; //registration page URL
        WindowModel.copyright = WindowModel.config["copyright"];
        WindowModel.copyrightTxt = WindowModel.config["copyrightTxt"]; //license text
        WindowModel.footerText = WindowModel.config["footerText"] || undefined;
        WindowModel.loginNotice = WindowModel.config["loginNotice"] || undefined;
        WindowModel.siteLinks = WindowModel.config["links"] || [];
        WindowModel.defaultLang = WindowModel.config["defaultLang"] || undefined;
        WindowModel.privacyUrl = WindowModel.config["privacyUrl"] || undefined;
        WindowModel.termsUrl = WindowModel.config["termsUrl"] || undefined;
        WindowModel.requireConsent = !!WindowModel.config["requireConsent"] && !!(WindowModel.privacyUrl || WindowModel.termsUrl);
        WindowModel.maintenance = WindowModel.config["maintenance"] || undefined;
        WindowModel.upload = WindowModel.config["upload"] || false;
        // Legacy top-level switches (darkTheme / compactTheme / skin / brutalistTheme /
        // liquidGlass / menuMode) are folded into theme so the rest of the app reads one place;
        // an explicit theme.* value wins over them.
        const cfg = WindowModel.config;
        const legacySkin = cfg["skin"] || (cfg["brutalistTheme"] ? "brutalist" : cfg["liquidGlass"] ? "liquid-glass" : undefined);
        WindowModel.theme = {
            primaryColor: "#3f51b5",
            dark: cfg["darkTheme"],
            compact: cfg["compactTheme"],
            skin: legacySkin,
            menuMode: cfg["menuMode"],
            ...(cfg["theme"] || {})
        };
    }

    public static eruptEvent: {
        login?: Function,
        logout?: Function,
        startup?: Function
        upload?: Function;
    } = window["eruptEvent"] || {};

    public static eruptRouterEvent: {
        login?: EventCycle,
        $?: EventCycle,
        [key: string]: EventCycle;
    } = window["eruptRouterEvent"] || {};
}

interface EventCycle {
    load: (e?: any) => void,
    unload: (e?: any) => void,
}

export interface UserTool {
    icon: string;

    text: string;

    click(event: Event): void;
}


export interface CustomerTool {

    icon: string;

    text: string;

    mobileHidden: boolean;

    render: string | Function;

    load(): void;

    click(event: Event): void;
}
