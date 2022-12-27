import {WindowModel} from "@shared/model/window.model";

export class GlobalKeys {
    //登录回退路径
    public static loginBackPath: string = "loginBackPath";

    public static getAppToken: string = "getAppToken";

}

export class RestPath {
  public static erupt: string = WindowModel.domain + "erupt-api";
  public static eruptApp: string = RestPath.erupt + "/erupt-app";
  public static tpl: string = RestPath.erupt + "/tpl";
  public static build: string = RestPath.erupt + "/build";
  public static data: string = RestPath.erupt + "/data";
  public static component: string = RestPath.erupt + "/comp";
  public static dataModify: string = RestPath.data + "/modify";
  public static comp: string = RestPath.erupt + "/comp";
  public static excel: string = RestPath.erupt + "/excel";
  public static file: string = RestPath.erupt + "/file";
  public static eruptAttachment: string = WindowModel.domain + "erupt-attachment";
  public static bi: string = RestPath.erupt + "/bi";
}
