/**
 * Created by liyuepeng on 10/17/18.
 */
import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Tree } from "../model/erupt.model";
import { _HttpClient } from "@delon/theme";
import { Observable } from "rxjs";
import { loginModel } from "../model/user.model";
import { EruptApiModel } from "../model/erupt-api.model";
import { EruptBuildModel } from "../model/erupt-build.model";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";
import { RestPath } from "../model/erupt.enum";
import { WindowModel } from "../window.model";

@Injectable()
export class DataService {

  public upload: string = RestPath.file + "upload/";

  public excelImport: string = RestPath.excel + "import/";

  public static PARAM_ERUPT: string = "_erupt";

  public static PARAM_TOKEN: string = "_token";

  constructor(private http: HttpClient, private _http: _HttpClient, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
  }

  //获取结构
  getEruptBuild(modelName: string): Observable<EruptBuildModel> {
    return this._http.get<EruptBuildModel>(RestPath.build + modelName, null, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }

  //tree数据结构
  queryEruptTreeData(modelName: string): Observable<Tree[]> {
    return this._http.get<Tree[]>(RestPath.data + "tree/" + modelName, null, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }

  //根据id获取数据
  queryEruptDataById(modelName: string, id: any): Observable<any> {
    return this._http.get<any>(RestPath.data + modelName + "/" + id, null, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }


  findTabListById(modelName: string, id: string, tabFieldName: string): Observable<any[]> {
    return this._http.get<any[]>(RestPath.data + "tab/table/" + modelName + "/" + id + "/" + RestPath.NO_RIGHT_SYMBOL + tabFieldName, null, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }

  findTabTree(modelName: string, tabFieldName: string): Observable<Tree[]> {
    return this._http.get<Tree[]>(RestPath.data + "tab/tree/" + modelName + "/" + RestPath.NO_RIGHT_SYMBOL + tabFieldName, null, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }

  findTabTreeById(modelName: string, id: string, tabFieldName: string): Observable<any> {
    return this._http.get<any>(RestPath.data + "tab/tree/" + modelName + "/" + id + "/" + RestPath.NO_RIGHT_SYMBOL + tabFieldName, null, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }

  //执行自定义operator方法
  execOperatorFun(modelName: string, operatorCode: string, data: any, param: object) {
    return this._http.post<EruptApiModel>(RestPath.data + modelName + "/operator/" + operatorCode, {
      data: data,
      param: param
    }, null, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }

  //获取reference-tree数据
  queryReferenceTreeData(modelName: string, refName: string, dependVal: any): Observable<Tree[]> {
    let param = {};
    if (dependVal) {
      param["dependValue"] = dependVal;
    }
    return this._http.get<Tree[]>(RestPath.data + modelName + "/reference-tree/" + refName, param, {
      observe: "body",
      headers: {
        erupt: modelName
      }
    });
  }

  //增加数据
  addEruptData(modelName: string, data: any): Observable<any> {
    return this._http.post<any>(RestPath.data + modelName, data, null, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }

  //修改数据
  editEruptData(modelName: string, data: object): Observable<EruptApiModel> {
    return this._http.put<EruptApiModel>(RestPath.data + modelName, data, null, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }

  //删除数据
  deleteEruptData(modelName: string, id): Observable<EruptApiModel> {
    return this._http.delete(RestPath.data + modelName + "/" + id, null, {
      headers: {
        erupt: modelName
      }
    });
  }

  //批量删除数据
  deleteEruptDatas(modelName: string, ids: any[]): Observable<EruptApiModel> {
    return this._http.delete(RestPath.data + modelName, { ids: ids }, {
      headers: {
        erupt: modelName
      }
    });
  }

  //登录
  login(account: string, pwd: string, verifyCode?: any): Observable<loginModel> {
    return this._http.post(WindowModel.domain + "/login", {}, {
        account: account,
        pwd: pwd,
        verifyCode: verifyCode
      }
    );
  }

  changePwd(account: string, pwd: string, newPwd: string, newPwd2: string): Observable<EruptApiModel> {
    return this._http.post(WindowModel.domain + "/change-pwd", {}, {
        account: account,
        pwd: pwd,
        newPwd: newPwd,
        newPwd2: newPwd2
      }
    );
  }


  //获取菜单列表
  getMenu(): Observable<any[]> {
    return this._http.get(WindowModel.domain + "/menu", null);
  }

  downloadExcelTemplate(modelName: string) {
    DataService.postExcelFile(RestPath.excel + "template/" + modelName + "?" + this.createAuthParam(modelName));
  }

  downloadExcel(modelName: string, condition: any) {
    DataService.postExcelFile(RestPath.excel + "export/" + modelName + "?" + this.createAuthParam(modelName), condition);
  }

  createAuthParam(eruptName: string): string {
    return DataService.PARAM_ERUPT + "=" + eruptName + "&" + DataService.PARAM_TOKEN + "=" + this.tokenService.get().token;
  }

  static postExcelFile(url, params?: object) { //params是post请求需要的参数，url是请求url地址
    let form = document.createElement("form");
    form.style.display = "none";
    form.action = url;
    form.method = "post";
    document.body.appendChild(form);
    if (params) {
      for (let key in params) {
        let input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      }
    }
    form.submit();
    form.remove();
  }

  //获取验证码
  static getVerifyCodeUrl(account: string): string {
    return RestPath.ws + "code-img" + "?account=" + account + "&_t" + new Date().getTime();
  }

  static downloadAttachment(path: string): string {
    return RestPath.file + "download-attachment?path=" + path;
  }

  static previewAttachment(path: string): string {
    return RestPath.file + "preview-attachment?path=" + path;
  }

}
