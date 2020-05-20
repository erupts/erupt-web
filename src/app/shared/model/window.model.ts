export class WindowModel {

    private static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] || '';

    public static fileDomain: string = WindowModel.config["fileDomain"] || '';

    public static r_tools: CustomerTool[] = WindowModel.config["r_tools"] || [];

    public static amapKey: string = WindowModel.config["amapKey"];

    public static title: string = WindowModel.config["title"];

    public static desc: string = WindowModel.config["desc"] || undefined;

    public static routerReuse: boolean = WindowModel.config["routerReuse"] || false;

    public static logoPath: string = WindowModel.config["logoPath"] || "assets/logo.png";

    public static logoText: string = WindowModel.config["logoText"] || undefined;
    //注册页面地址
    public static registerPage: string = WindowModel.config["registerPage"] || undefined;

    public static dialogLogin: boolean = WindowModel.config["dialogLogin"] || false;
}


export interface CustomerTool {

    icon: string;

    text: string;

    mobileHidden: boolean;

    load(): void;

    click(event: Event): void;
}
