export interface SiteLink {
    name: string;
    url: string;
    icon?: string;
    // where the link opens: a new window, this window, or a page inside the app frame
    openWay?: "blank" | "self" | "frame";
    // where the link shows: header toolbar (default), the user's avatar menu, or the foot of the login page
    position?: "header" | "user" | "login";
}

// The site settings patch from /erupt-app: only the keys an administrator filled in
export interface SiteConfig {
    theme?: { dark?: boolean | "auto"; compact?: boolean; customizable?: boolean; skin?: string; loginBackground?: string; filter?: string; [key: string]: any };
    // erupt-app properties the site settings override (watermark, offered languages)
    app?: Partial<EruptAppModel>;
    // header toolbar links, rendered as plain links next to app.js r_tools
    links?: SiteLink[];
    // built-in header buttons to hide: search, notice, refresh, fullscreen, language, settings
    hiddenTools?: string[];
    defaultLang?: string;
    // installed app (PWA) icon, merged into eruptSiteConfig.pwa
    pwa?: { icon?: string };
    // maintenance mode is on: the text to show (non-administrators are refused)
    maintenance?: string;
    [key: string]: any;
}

export interface EruptAppModel {
    verifyCodeCount: number;
    pwdTransferEncrypt: boolean;
    locales: string[];
    hash: number;
    version: string;
    loginPagePath: string;
    waterMark: boolean;
    waterMarkDate: boolean;  // whether the watermark displays the date
    waterMarkContent: string;  // custom watermark content
    resetPwd: boolean;
    mfa: { enable: boolean; issuer: string; window: number };
    resetPwdPrompt: boolean;  // whether to prompt users who haven't changed the default password
    fileDomain?: string;  // attachment host from the backend AttachmentProxy; null when erupt serves attachments itself
    // site settings patch laid over window.eruptSiteConfig (WindowModel.applySite)
    site?: SiteConfig;
    properties: object;
}

let eruptAppConfig: EruptAppModel = window["eruptApp"] || {};

export class EruptAppData {

    static get() {
        return eruptAppConfig;
    }

    static put(value: EruptAppModel) {
        eruptAppConfig = value;
    }

}
