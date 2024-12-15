export class WindowModel {

    public static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] ? WindowModel.config["domain"] + "/" : '';

    public static fileDomain: string = WindowModel.config["fileDomain"] || undefined;

    public static r_tools: CustomerTool[];

    public static amapKey: string;

    public static amapSecurityJsCode: string;

    public static title: string;

    public static desc: string;

    public static logoPath: string;

    public static loginLogoPath: string;

    public static logoText: string;

    public static registerPage: string; //注册页面地址

    public static copyright: boolean;

    public static copyrightTxt: any; //授权文本

    public static upload: Function;

    public static init() {
        WindowModel.r_tools = WindowModel.config["r_tools"] || [];
        WindowModel.amapKey = WindowModel.config["amapKey"];
        WindowModel.amapSecurityJsCode = WindowModel.config["amapSecurityJsCode"];
        WindowModel.title = WindowModel.config["title"] || 'Erupt Framework';
        WindowModel.desc = WindowModel.config["desc"] || undefined;
        WindowModel.logoPath = WindowModel.config["logoPath"] === '' ? null : (WindowModel.config["logoPath"] || "erupt.svg");
        WindowModel.loginLogoPath = WindowModel.config["loginLogoPath"] === '' ? null : (WindowModel.config["loginLogoPath"] || WindowModel.logoPath);
        WindowModel.logoText = WindowModel.config["logoText"] || "";
        WindowModel.registerPage = WindowModel.config["registerPage"] || undefined; //注册页面地址
        WindowModel.copyright = WindowModel.config["copyright"];
        WindowModel.copyrightTxt = WindowModel.config["copyrightTxt"]; //授权文本
        WindowModel.upload = WindowModel.config["upload"] || false;
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


export interface CustomerTool {

    icon: string;

    text: string;

    mobileHidden: boolean;

    load(): void;

    click(event: Event): void;
}
