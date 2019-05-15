export class WindowModel {

  public static domain: string = window["domain"] || "";

  public static r_tools: CustomerTool[] = window["r_tools"] || [];

  public static mapKey: string = window["mapKey"];

  public static title: string = window["title"];
}


export interface CustomerTool {
  html: string;

  icon: string;

  mobileShow: boolean;

  click(event: Event, token: string): void;
}
