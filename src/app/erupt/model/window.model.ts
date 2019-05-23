export class WindowModel {

  public static domain: string = window["eruptSiteConfig"]["domain"] || "";

  public static r_tools: CustomerTool[] = window["eruptSiteConfig"]["r_tools"] || [];

  public static amapKey: string = window["eruptSiteConfig"]["amapKey"];

  public static title: string = window["eruptSiteConfig"]["title"];
}


export interface CustomerTool {
  html: string;

  icon: string;

  mobileShow: boolean;

  click(event: Event, token: string): void;
}
