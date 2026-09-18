export class WindowModel {

    public static VIS_TPL_DATA_KEY: string = "visTplData";

    public static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] ? WindowModel.config["domain"] + "/" : '';

    public static fileDomain: string = WindowModel.config["fileDomain"] || undefined;

    public static amapKey: string;

    public static amapSecurityJsCode: string;

    public static title: string;

    public static desc: string;

    public static logoPath: string;

    public static logoFoldPath: string;

    public static loginLogoPath: string;

    public static logoText: string;

    public static registerPage: string; //registration page URL

    public static copyright: boolean;

    public static copyrightTxt: any; //license text

    // eruptSiteConfig.theme — appearance defaults. Every entry applies only while the
    // user has no saved choice in the settings drawer.
    public static theme: {
        primaryColor?: string,
        // Header bar color: "primary" (follow the primary color) or a literal
        // CSS color; users can still override it in the settings drawer.
        headerColor?: string,
        // false | true | "auto" (follow the OS color scheme)
        dark?: boolean | "auto",
        compact?: boolean,
        // "default" | "brutalist" | "liquid-glass"
        skin?: string,
        // "normal" | "split" | "dual" | "top" | "group" | "top-split" (MenuMode)
        menuMode?: string,
        // "center" | "side" | "full" (FormPanelMode): how record forms open
        formPanelMode?: string,
        [key: string]: any
    }

    public static r_tools: CustomerTool[];

    public static userTools: UserTool[];

    public static upload: Function;

    public static init() {
        WindowModel.r_tools = WindowModel.config["r_tools"] || [];
        WindowModel.userTools = WindowModel.config["userTools"] || [];
        WindowModel.amapKey = WindowModel.config["amapKey"];
        WindowModel.amapSecurityJsCode = WindowModel.config["amapSecurityJsCode"];
        WindowModel.title = WindowModel.config["title"] === null ? 'Erupt Engine' : WindowModel.config["title"];
        WindowModel.desc = WindowModel.config["desc"] || undefined;
        WindowModel.logoPath = WindowModel.config["logoPath"] === '' ? null : (WindowModel.config["logoPath"] || "assets/logo.svg");
        // Collapsed brand mark. Falling back to the expanded logo is right when
        // that logo is the site's own, but erupt's built-in mark is not a
        // stand-in for somebody else's product, so a site that configured
        // neither gets null here and the header draws a neutral placeholder.
        WindowModel.logoFoldPath = WindowModel.config["logoFoldPath"]
            || (WindowModel.config["logoPath"] ? WindowModel.logoPath : null);
        WindowModel.loginLogoPath = WindowModel.config["loginLogoPath"] === '' ? null : (WindowModel.config["loginLogoPath"] || WindowModel.logoPath);
        WindowModel.logoText = WindowModel.config["logoText"] || WindowModel.title;
        WindowModel.registerPage = WindowModel.config["registerPage"] || undefined; //registration page URL
        WindowModel.copyright = WindowModel.config["copyright"];
        WindowModel.copyrightTxt = WindowModel.config["copyrightTxt"]; //license text
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
