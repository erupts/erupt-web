export class WindowModel {

    private static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] ? WindowModel.config["domain"] + "/" : '';

    public static fileDomain: string = WindowModel.config["fileDomain"] || undefined;

    public static r_tools: CustomerTool[] = WindowModel.config["r_tools"] || [];

    public static amapKey: string = WindowModel.config["amapKey"];

    public static amapSecurityJsCode: string = WindowModel.config["amapSecurityJsCode"];

    public static title: string = WindowModel.config["title"] || 'Erupt Framework';

    public static desc: string = WindowModel.config["desc"] || undefined;

    public static logoPath: string = WindowModel.config["logoPath"] === '' ? null : (WindowModel.config["logoPath"] || "erupt.svg");

    public static loginLogoPath: string = WindowModel.config["loginLogoPath"] === '' ? null : (WindowModel.config["loginLogoPath"] || WindowModel.logoPath);

    public static logoText: string = WindowModel.config["logoText"] || "";

    public static registerPage: string = WindowModel.config["registerPage"] || undefined; //注册页面地址

    public static copyright: boolean = WindowModel.config["copyright"];

    public static copyrightTxt: any = WindowModel.config["copyrightTxt"]; //授权文本

    public static upload: Function = WindowModel.config["upload"] || false;

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
