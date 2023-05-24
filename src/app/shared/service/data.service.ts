import {Inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Checkbox, Page, Row, Tree} from "../../build/erupt/model/erupt.model";
import {_HttpClient, ALAIN_I18N_TOKEN} from "@delon/theme";
import {Observable} from "rxjs";
import {LoginModel, Userinfo} from "../model/user.model";
import {EruptApiModel} from "../../build/erupt/model/erupt-api.model";
import {EruptBuildModel} from "../../build/erupt/model/erupt-build.model";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {RestPath} from "../../build/erupt/model/erupt.enum";
import {WindowModel} from "@shared/model/window.model";
import {MenuVo} from "@shared/model/erupt-menu";
import {VL} from "../../build/erupt/model/erupt-field.model";
import {I18NService} from "@core";
import {downloadFile} from "@shared/util/erupt.util";

@Injectable()
export class DataService {

    public static PARAM_ERUPT: string = "_erupt";

    public static PARAM_TOKEN: string = "_token";

    public upload: string = RestPath.file + "/upload/";

    public excelImport: string = RestPath.excel + "/import/";

    constructor(private http: HttpClient, private _http: _HttpClient,
                @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
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
    static getVerifyCodeUrl(mark: any): string {
        return RestPath.erupt + "/code-img?mark=" + mark;
    }

    static downloadAttachment(path: string): string {
        if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
            return path;
        } else if (WindowModel.fileDomain) {
            return WindowModel.fileDomain + path;
        } else {
            return RestPath.file + "/download-attachment" + path;
        }
    }

    static previewAttachment(path: string): string {
        if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
            return path;
        } else if (WindowModel.fileDomain) {
            return WindowModel.fileDomain + path;
        } else {
            return RestPath.eruptAttachment + path;
        }
    }

    getCommonHeader() {
        return {
            lang: this.i18n.currentLang || '',
        };
    }


    //获取结构
    getEruptBuild(eruptName: string, eruptParentName?: string): Observable<EruptBuildModel> {
        return this._http.get<EruptBuildModel>(RestPath.build + "/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...this.getCommonHeader()
            }
        });
    }

    //自定义行
    extraRow(eruptName: string, condition?: object): Observable<Row[]> {
        return this._http.post(RestPath.data + "/extra-row/" + eruptName, condition, null, {
            observe: 'body',
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    getEruptBuildByField(eruptName: string, field: string, eruptParentName?: string): Observable<EruptBuildModel> {
        return this._http.get<EruptBuildModel>(RestPath.build + "/" + eruptName + "/" + field, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...this.getCommonHeader()
            }
        });
    }

    getEruptTpl(name: string) {
        let params = "_token=" + this.tokenService.get().token + "&_lang=" + this.i18n.currentLang;
        if (name.indexOf("?") == -1) {
            return RestPath.tpl + "/" + name + "?" + params;
        } else {
            return RestPath.tpl + "/" + name + "&" + params;
        }
    }

    getEruptOperationTpl(eruptName: string, operationCode: string, ids: any[]) {
        return RestPath.tpl + "/operation_tpl/" + eruptName + "/" + operationCode +
            "?_token=" + this.tokenService.get().token + "&_lang=" + this.i18n.currentLang + "&_erupt=" + eruptName + "&ids=" + ids;
    }

    //分页数据对象
    queryEruptTableData(eruptName: string, page: Page): Observable<Page> {
        return this._http.post(RestPath.data + "/table/" + eruptName, page, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }


    //tree数据结构
    queryEruptTreeData(eruptName: string): Observable<Tree[]> {
        return this._http.get<Tree[]>(RestPath.data + "/tree/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //根据id获取数据
    queryEruptDataById(eruptName: string, id: any): Observable<any> {
        return this._http.get<any>(RestPath.data + "/" + eruptName + "/" + id, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //获取初始化数据
    getInitValue(eruptName: string, eruptParentName?: string, drill?: { erupt: string, code: string, eruptParent: string, val: any }): Observable<any> {
        return this._http.get<any>(RestPath.data + "/init-value/" + eruptName, drill, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...this.getCommonHeader()
            }
        });
    }

    findAutoCompleteValue(eruptName: string, field: string, formData: any, val: string, eruptParentName?: string): Observable<string[]> {
        return this._http.post(RestPath.comp + "/auto-complete/" + eruptName + "/" + field, formData, {
            val: val.trim(),
        }, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...this.getCommonHeader()
            }
        });
    }

    findChoiceItem(eruptName: string, field: string, eruptParentName?: string): Observable<VL[]> {
        return this._http.get<VL[]>(RestPath.component + "/choice-item/" + eruptName + "/" + field, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...this.getCommonHeader()
            }
        });
    }

    findTagsItem(eruptName: string, field: string, eruptParentName?: string): Observable<string[]> {
        return this._http.get<string[]>(RestPath.component + "/tags-item/" + eruptName + "/" + field, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...this.getCommonHeader()
            }
        });
    }


    findTabTree(eruptName: string, tabFieldName: string): Observable<Tree[]> {
        return this._http.get<Tree[]>(RestPath.data + "/tab/tree/" + eruptName + "/" + tabFieldName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    findCheckBox(eruptName: string, fieldName: string): Observable<Checkbox[]> {
        return this._http.get<Checkbox[]>(RestPath.data + "/" + eruptName + "/checkbox/" + fieldName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //执行自定义operator方法
    execOperatorFun(eruptName: string, operatorCode: string, ids: any, param: object) {
        return this._http.post(RestPath.data + "/" + eruptName + "/operator/" + operatorCode, {
            ids: ids,
            param: param
        }, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    queryDependTreeData(eruptName: string) {
        return this._http.get<Tree[]>(RestPath.data + "/depend-tree/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //获取reference-tree数据
    queryReferenceTreeData(eruptName: string, refName: string, dependVal?: any, eruptParent?: string): Observable<Tree[]> {
        let param = {};
        if (dependVal) {
            param["dependValue"] = dependVal;
        }
        let header = {
            erupt: eruptName,
            ...this.getCommonHeader()
        };
        if (eruptParent) {
            header["eruptParent"] = eruptParent;
        }
        return this._http.get<Tree[]>(RestPath.data + "/" + eruptName + "/reference-tree/" + refName, param, {
            observe: "body",
            headers: header
        });
    }


    //下钻新增
    addEruptDrillData(eruptName: string, code: string, val: any, data: any): Observable<any> {
        return this._http.post<any>(RestPath.data + "/add/" + eruptName + "/drill/" + code + "/" + val, data, null, {
            observe: null,
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //增加数据
    addEruptData(eruptName: string, data: any, headers?: object): Observable<any> {
        return this._http.post<any>(RestPath.dataModify + "/" + eruptName, data, null, {
            observe: null,
            headers: {
                erupt: eruptName,
                ...headers,
                ...this.getCommonHeader()
            }
        });
    }

    //修改数据
    editEruptData(eruptName: string, data: object): Observable<EruptApiModel> {
        return this._http.put<EruptApiModel>(RestPath.dataModify + "/" + eruptName, data, null, {
            observe: null,
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //删除数据
    deleteEruptData(eruptName: string, id): Observable<EruptApiModel> {
        return this._http.delete(RestPath.dataModify + "/" + eruptName + "/" + id, null, {
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //批量删除数据
    deleteEruptDatas(eruptName: string, ids: any[]): Observable<EruptApiModel> {
        return this._http.delete(RestPath.dataModify + "/" + eruptName, {ids: ids}, {
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    eruptDataValidate(eruptName: string, data: any, eruptParent?: string): Observable<EruptApiModel> {
        return this._http.post(RestPath.data + "/validate-erupt/" + eruptName, data, null, {
            headers: {
                erupt: eruptName,
                eruptParent: eruptParent || "",
                ...this.getCommonHeader()
            }
        });
    }

    eruptTabAdd(eruptName: string, tabName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/tab-add/" + eruptName + "/" + tabName, data, null, {
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    eruptTabUpdate(eruptName: string, tabName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/tab-update/" + eruptName + "/" + tabName, data, null, {
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    eruptTabDelete(eruptName: string, tabName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/tab-delete/" + eruptName + "/" + tabName, data, null, {
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        });
    }

    //登录
    login(account: string, pwd: string, verifyCode?: any, verifyCodeMark?: any): Observable<LoginModel> {
        return this._http.get(RestPath.erupt + "/login", {
                account: account,
                pwd: pwd,
                verifyCode: verifyCode,
                verifyCodeMark: verifyCodeMark
            }
        );
    }

    logout() {
        return this._http.get(RestPath.erupt + "/logout");
    }

    pwdEncode(str: string, count: number): string {
        str = encodeURIComponent(str);
        for (; count > 0; count--) {
            str = btoa(str)
        }
        return str;
    }


    changePwd(pwd: string, newPwd: string, newPwd2: string): Observable<EruptApiModel> {
        return this._http.get(RestPath.erupt + "/change-pwd", {
                pwd: this.pwdEncode(pwd, 3),
                newPwd: this.pwdEncode(newPwd, 3),
                newPwd2: this.pwdEncode(newPwd2, 3)
            }
        );
    }

    //获取菜单
    getMenu(): Observable<MenuVo[]> {
        return this._http.get<MenuVo[]>(RestPath.erupt + "/menu");
    }

    getUserinfo(): Observable<Userinfo> {
        return this._http.get<Userinfo>(RestPath.erupt + "/userinfo");
    }

    downloadExcelTemplate(eruptName: string, callback?) {
        this._http.get(RestPath.excel + "/template/" + eruptName, null, {
            responseType: "arraybuffer",
            observe: 'events',
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        }).subscribe((res) => {
            if (res.type !== 4) {
                // 还没准备好，无需处理
                return;
            }
            downloadFile(res);
            callback();
        }, () => {
            callback();
        });
        // DataService.postExcelFile(RestPath.excel + "/template/" + eruptName + "?" + this.createAuthParam(eruptName));
    }

    downloadExcel(eruptName: string, condition: any, callback) {
        this._http.post(RestPath.excel + "/export/" + eruptName, condition, null, {
            responseType: "arraybuffer",
            observe: 'events',
            headers: {
                erupt: eruptName,
                ...this.getCommonHeader()
            }
        }).subscribe((res) => {
            if (res.type !== 4) {
                // 还没准备好，无需处理
                return;
            }
            downloadFile(res);
            callback();
        }, () => {
            callback();
        });
        // let param: any = {};
        // if (condition) {
        //     param.condition = encodeURIComponent(JSON.stringify(condition));
        // }
        // DataService.postExcelFile(RestPath.excel + "/export/" + eruptName + "?" + this.createAuthParam(eruptName), param);
    }

    downloadExcel2(eruptName: string, condition: any) {
        let param: any = {};
        if (condition) {
            param.condition = encodeURIComponent(JSON.stringify(condition));
        }
        DataService.postExcelFile(RestPath.excel + "/export/" + eruptName + "?" + this.createAuthParam(eruptName), param);
    }

    createAuthParam(eruptName: string): string {
        return DataService.PARAM_ERUPT + "=" + eruptName + "&" + DataService.PARAM_TOKEN + "=" + this.tokenService.get().token;
    }

    getFieldTplPath(eruptName: string, fieldName: string): string {
        return RestPath.tpl + "/" + "html-field/" + eruptName + "/" + fieldName + "?_token=" + this.tokenService.get().token + "&_erupt=" + eruptName;
    }


}
