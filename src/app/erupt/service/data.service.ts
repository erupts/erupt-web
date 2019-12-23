/**
 * Created by liyuepeng on 10/17/18.
 */
import {Inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Tree} from "../model/erupt.model";
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {loginModel} from "../model/user.model";
import {EruptApiModel} from "../model/erupt-api.model";
import {EruptBuildModel} from "../model/erupt-build.model";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {RestPath} from "../model/erupt.enum";

@Injectable()
export class DataService {

    public static PARAM_ERUPT: string = "_erupt";

    public static PARAM_TOKEN: string = "_token";

    public upload: string = RestPath.file + "upload/";

    public excelImport: string = RestPath.excel + "import/";

    constructor(private http: HttpClient, private _http: _HttpClient, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
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
        return RestPath.erupt + "/code-img" + "?account=" + account + "&_t" + new Date().getTime();
    }

    static downloadAttachment(path: string): string {
        return RestPath.file + "download-attachment?path=" + path;
    }

    static previewAttachment(path: string): string {
        return RestPath.file + "preview-attachment?path=" + path;
    }

    //获取结构
    getEruptBuild(eruptName: string): Observable<EruptBuildModel> {
        return this._http.get<EruptBuildModel>(RestPath.build + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    getEruptFieldHtml(eruptName: string, fieldName: string) {
        return this.http.get(RestPath.tpl + "html-field/" + eruptName + "/" + fieldName, {
            responseType: "text",
            headers: {
                erupt: eruptName,
                token: this.tokenService.get().token
            }
        });
    }

    getEruptTpl(name: string) {
        return this.http.get(RestPath.tpl + "html/" + name, {
            responseType: "text",
            headers: {
                token: this.tokenService.get().token
            }
        });
    }

    //tree数据结构
    queryEruptTreeData(eruptName: string): Observable<Tree[]> {
        return this._http.get<Tree[]>(RestPath.data + "tree/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //根据id获取数据
    queryEruptDataById(eruptName: string, id: any): Observable<any> {
        return this._http.get<any>(RestPath.data + eruptName + "/" + id, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }


    findTabTree(eruptName: string, tabFieldName: string): Observable<Tree[]> {
        return this._http.get<Tree[]>(RestPath.data + "tab/tree/" + eruptName + "/" + tabFieldName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //执行自定义operator方法
    execOperatorFun(eruptName: string, operatorCode: string, data: any, param: object) {
        return this._http.post(RestPath.data + eruptName + "/operator/" + operatorCode, {
            data: data,
            param: param
        }, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //获取reference-tree数据
    queryReferenceTreeData(eruptName: string, refName: string, dependVal: any, eruptParent?: string): Observable<Tree[]> {
        let param = {};
        if (dependVal) {
            param["dependValue"] = dependVal;
        }
        let header = {
            erupt: eruptName
        };
        if (eruptParent) {
            header["eruptParent"] = eruptParent;
        }
        return this._http.get<Tree[]>(RestPath.data + eruptName + "/reference-tree/" + refName, param, {
            observe: "body",
            headers: header
        });
    }

    //增加数据
    addEruptData(eruptName: string, data: any): Observable<any> {
        return this._http.post<any>(RestPath.data + eruptName, data, null, {
            observe: null,
            headers: {
                erupt: eruptName
            }
        });
    }

    //修改数据
    editEruptData(eruptName: string, data: object): Observable<EruptApiModel> {
        return this._http.put<EruptApiModel>(RestPath.data + eruptName, data, null, {
            observe: null,
            headers: {
                erupt: eruptName
            }
        });
    }

    //删除数据
    deleteEruptData(eruptName: string, id): Observable<EruptApiModel> {
        return this._http.delete(RestPath.data + eruptName + "/" + id, null, {
            headers: {
                erupt: eruptName
            }
        });
    }

    //批量删除数据
    deleteEruptDatas(eruptName: string, ids: any[]): Observable<EruptApiModel> {
        return this._http.delete(RestPath.data + eruptName, {ids: ids}, {
            headers: {
                erupt: eruptName
            }
        });
    }

    eruptDataValidate(eruptName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.data + "validate-erupt/" + eruptName, data, null, {
            headers: {
                erupt: eruptName
            }
        });
    }

    //登录
    login(account: string, pwd: string, verifyCode?: any): Observable<loginModel> {
        return this._http.post(RestPath.erupt + "/login", {}, {
                account: account,
                pwd: pwd,
                verifyCode: verifyCode
            }
        );
    }

    logout() {
        return this._http.post(RestPath.erupt + "/logout");
    }

    changePwd(account: string, pwd: string, newPwd: string, newPwd2: string): Observable<EruptApiModel> {
        return this._http.post(RestPath.erupt + "/change-pwd", {}, {
                account: account,
                pwd: pwd,
                newPwd: newPwd,
                newPwd2: newPwd2
            }
        );
    }

    //获取菜单列表
    getMenu(): Observable<any[]> {
        return this._http.get(RestPath.erupt + "/menu", null);
    }

    downloadExcelTemplate(eruptName: string) {
        DataService.postExcelFile(RestPath.excel + "template/" + eruptName + "?" + this.createAuthParam(eruptName));
    }

    downloadExcel(eruptName: string, condition: any) {
        DataService.postExcelFile(RestPath.excel + "export/" + eruptName + "?" + this.createAuthParam(eruptName), {
            condition: encodeURIComponent(JSON.stringify(condition))
        });
    }

    createAuthParam(eruptName: string): string {
        return DataService.PARAM_ERUPT + "=" + eruptName + "&" + DataService.PARAM_TOKEN + "=" + this.tokenService.get().token;
    }

}
