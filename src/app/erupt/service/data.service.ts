/**
 * Created by liyuepeng on 10/17/18.
 */
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EruptModel, Tree } from "../model/erupt.model";
import { Page } from "../model/page";
import { _HttpClient } from "@delon/theme";
import { Observable } from "rxjs";
import { loginModel } from "../model/user.model";
import { EruptApiModel } from "../model/erupt-api.model";

@Injectable()
export class DataService {

  domain: string = window["domain"];

  eruptHeaderKey: String = "erupt";


  constructor(private http: HttpClient, private _http: _HttpClient) {
  }

  getEruptBuild(modelName: string): Observable<EruptModel> {
    return this._http.get<EruptModel>(this.domain + "/erupt-api/build/list/" + modelName, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  queryEruptData(modelName: string, condition: any, page: Page): Observable<Page> {
    return this.http.post<Page>(this.domain + "/erupt-api/data/table/" + modelName, {
      condition: condition,
      page: page
    }, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  queryEruptTreeData(modelName: string): Observable<Array<Tree>> {
    return this.http.post<Array<Tree>>(this.domain + "/erupt-api/data/tree/" + modelName, {}, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  execOperatorFun(modelName: string, operatorCode: string, keys: any, param: any) {
    return this.http.post<Page>(this.domain + "/erupt-api/data/" + modelName + "/operator/" + operatorCode, {
      keys,
      param
    }, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  queryEruptReferenceData(modelName: string, refName: string): Observable<any> {
    return this.http.get(this.domain + "/erupt-api/data/" + modelName + "/ref/" + refName, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  addEruptData(modelName: string, data: any): Observable<EruptApiModel> {
    return this.http.post<EruptApiModel>(this.domain + "/erupt-api/data/" + modelName, data, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  deleteEruptData(modelName: string, id): Observable<EruptApiModel> {
    return this.http.delete<EruptApiModel>(this.domain + "/erupt-api/data/" + modelName + "/" + id, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  deleteEruptDatas(modelName: string, ids: Array<any>): Observable<EruptApiModel> {
    return this.http.delete<EruptApiModel>(this.domain + "/erupt-api/data/" + modelName, {
      params: {
        ids: ids
      },
      headers: {
        eruptKey: modelName
      }
    });
  }

  downloadEruptExcel(modelName: string): Observable<any> {
    return this.http.get(this.domain + "/erupt-api/excel/" + modelName, {
      headers: {
        eruptKey: modelName
      }
    });
  }

  getVerifyCodeUrl(): string {
    return this.domain + "/verify/code-img" + "?_t" + new Date().getTime();
  }

  login(account: string, pwd: string, verifyCode?: any): Observable<loginModel> {
    return this._http.post(this.domain + "/erupt-user/login", {}, {
        account: account,
        pwd: pwd,
        verifyCode: verifyCode
      }
    );
  }

  getMenu(): Observable<any> {
    return this.http.post(this.domain + "/erupt-user/menu", {});
  }
}
