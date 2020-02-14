export class WindowModel {

    private static config: any = window["eruptSiteConfig"] || {};

    public static domain: string = WindowModel.config["domain"] || "";

    public static r_tools: CustomerTool[] = WindowModel.config["r_tools"] || [];

    public static amapKey: string = WindowModel.config["amapKey"];

    public static title: string = WindowModel.config["title"];

    public static desc: string = WindowModel.config["desc"] || null;

    public static routerReuse: boolean = WindowModel.config["routerReuse"] || false;

    public static logoPath: string = WindowModel.config["logoPath"] || "assets/logo.png";
    //注册页面地址
    public static registerPage: string = WindowModel.config["registerPage"] || null;
}


export interface CustomerTool {

    icon: string;

    text: string;

    mobileHidden: boolean;

    load(event: Event, token: string): void;

    click(event: Event, token: string): void;
}
