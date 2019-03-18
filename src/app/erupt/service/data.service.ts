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
import { EruptPageModel } from "../model/erupt-page.model";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";
import { RestPath } from "../model/erupt.enum";

@Injectable()
export class DataService {

  public domain: string = window["domain"];

  public upload: string = this.domain + "/erupt-api/file/upload/";

  public NO_RIGHT_SYMBOL: string = "__";

  constructor(private http: HttpClient, private _http: _HttpClient, @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService) {
  }

  //获取结构
  getEruptBuild(modelName: string): Observable<EruptPageModel> {
    return this._http.get<EruptPageModel>(RestPath.build + "list/" + modelName, null, {
      responseType: "json",
      headers: {
        erupt: modelName
      }
    });
  }

  //查询tree数据结构数据
  queryEruptTreeData(modelName: string): Observable<Array<Tree>> {
    return this._http.post<Array<Tree>>(RestPath.data + "tree/" + modelName, {}, {}, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }


  findTabListById(modelName: string, id: string, tabFieldName: string): Observable<any> {
    return this._http.post(RestPath.data + "table/" + modelName + "/" + id + "/" + this.NO_RIGHT_SYMBOL + tabFieldName, null, null, {
      headers: {
        erupt: modelName
      }
    });
  }

  findTabTree(modelName: string, tabFieldName: string): Observable<Array<Tree>> {
    return this._http.post<Array<Tree>>(RestPath.data + "tree/" + modelName + "/" + this.NO_RIGHT_SYMBOL + tabFieldName, null, null, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }

  findTabTreeById(modelName: string, id: string, tabFieldName: string): Observable<any> {
    return this._http.post<any>(RestPath.data + "tree/" + modelName + "/" + id + "/" + this.NO_RIGHT_SYMBOL + tabFieldName, null, null, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }

  //根据id获取数据
  queryEruptDataById(modelName: string, id: any): Observable<EruptApiModel> {
    return this._http.get<EruptApiModel>(RestPath.data + modelName + "/" + id, null, {
      responseType: "json",
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

  //获取reference数据
  queryEruptReferenceData(modelName: string, refName: string): Observable<any> {
    return this._http.get(RestPath.data + modelName + "/ref/" + refName, null, {
      headers: {
        erupt: modelName
      }
    });
  }

  //增加数据
  addEruptData(modelName: string, data: any): Observable<EruptApiModel> {
    return this._http.post<EruptApiModel>(RestPath.data + modelName, data, null, {
      observe: null,
      headers: {
        erupt: modelName
      }
    });
  }

  //修改数据
  editEruptData(modelName: string, data: any): Observable<EruptApiModel> {
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
  deleteEruptDatas(modelName: string, ids: Array<any>): Observable<EruptApiModel> {
    return this._http.delete(RestPath.data + modelName, { ids: ids }, {
      headers: {
        erupt: modelName
      }
    });
  }

  downloadEruptExcel(modelName: string): Observable<any> {
    return this._http.get(this.domain + "/erupt-api/excel/" + modelName, {}, {
      headers: {
        erupt: modelName
      }
    });
  }

  //获取验证码
  getVerifyCodeUrl(account: string): string {
    return this.domain + "/ws/code-img" + "?account=" + account + "&_t" + new Date().getTime();
  }

  //登录接口
  login(account: string, pwd: string, verifyCode?: any): Observable<loginModel> {
    return this._http.post(this.domain + "/ws/login", {}, {
        account: account,
        pwd: pwd,
        verifyCode: verifyCode
      }
    );
  }

  //获取菜单接口
  getMenu(): Observable<Array<any>> {
    return this._http.get(this.domain + "/menu", null);
  }

  previewAttachment(eruptName: string, path: string): string {
    return RestPath.DONT_INTERCEPT + "preview-attachment?path=" + path;
  }

  downloadAttachment(path: string) {
    window.open(`/assets/attachment-download.html?path=${path}&token=${this.tokenService.get().token}`);
  }
}
