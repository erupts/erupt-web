import {Inject, Injectable} from "@angular/core";
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {Announcement, LoginModel, NoticeChannel, NoticeMessageDetail, NoticeScene, Userinfo} from "../model/user.model";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {WindowModel} from "@shared/model/window.model";
import {MenuVo} from "@shared/model/erupt-menu";
import {I18NService} from "@core";
import {downloadFile} from "@shared/util/erupt.util";
import {RestPath} from "../../build/erupt/model/erupt.enum";
import {VL} from "../../build/erupt/model/erupt-field.model";
import {Checkbox, DrillInput, Page, Row, Tree} from "../../build/erupt/model/erupt.model";
import {EruptApiModel} from "../../build/erupt/model/erupt-api.model";
import {EruptBuildModel} from "../../build/erupt/model/erupt-build.model";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {R, SimplePage} from "@shared/model/api.model";
import {NoticeStatus} from "@shared/model/notice.model";

@Injectable()
export class DataService {

    public static PARAM_ERUPT: string = "_erupt";

    public static PARAM_TOKEN: string = "_token";

    public upload: string = RestPath.file + "/upload/";

    public excelImport: string = RestPath.excel + "/import/";

    private static tokenService: ITokenService

    constructor(private _http: _HttpClient,
                private i18n: I18NService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        DataService.tokenService = this.tokenService;
    }

    static postExcelFile(url: string, params?: any) { //params are the parameters required for the POST request, url is the request URL
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

    //get verification code URL
    static getVerifyCodeUrl(mark: any): string {
        return RestPath.erupt + "/code-img?mark=" + mark;
    }

    public static drillToHeader(drillInput: DrillInput): object {
        return {
            drill: drillInput.code,
            drillSourceErupt: drillInput.eruptParent,
            drillValue: drillInput.val
        }
    }

    static previewAttachment(path: string, download: boolean = false): string {
        let token = "_token=" + (DataService.tokenService.get().token || '');
        if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
            if (path.indexOf("?") == -1) {
                return path + "?" + token;
            } else {
                return path + "&" + token;
            }
        } else if (WindowModel.fileDomain) {
            if (WindowModel.fileDomain.indexOf("?") == -1) {
                return WindowModel.fileDomain + path + "?" + token;
            } else {
                return WindowModel.fileDomain + path + "&" + token;
            }
        } else {
            if (download) {
                return RestPath.file + "/download-attachment" + path + "?" + token;
            } else {
                return RestPath.eruptAttachment + path + "?" + token;
            }
        }
    }

    //get schema
    getEruptBuild(eruptName: string, eruptParentName?: string): Observable<EruptBuildModel> {
        return this._http.get<EruptBuildModel>(RestPath.build + "/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
            }
        });
    }

    //custom rows
    extraRow(eruptName: string, condition?: object): Observable<Row[]> {
        return this._http.post(RestPath.data + "/extra-row/" + eruptName, condition, null, {
            observe: 'body',
            headers: {
                erupt: eruptName
            }
        });
    }

    getEruptBuildByField(eruptName: string, field: string, eruptParentName?: string): Observable<EruptBuildModel> {
        return this._http.get<EruptBuildModel>(RestPath.build + "/" + eruptName + "/" + field, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
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
        return RestPath.tpl + "/operation-tpl/" + eruptName + "/" + operationCode +
            "?_token=" + this.tokenService.get().token + "&_lang=" + this.i18n.currentLang + "&_erupt=" + eruptName + "&ids=" + ids;
    }

    getEruptVisTpl(eruptName: string, visCode: string) {
        return RestPath.tpl + "/vis-tpl/" + eruptName + "/" + visCode +
            "?_token=" + this.tokenService.get().token + "&_lang=" + this.i18n.currentLang + "&_erupt=" + eruptName;
    }

    getEruptViewTpl(eruptName: string, field: string, id: any) {
        return RestPath.tpl + "/view-tpl/" + eruptName + "/" + field + "/" + id +
            "?_token=" + this.tokenService.get().token + "&_lang=" + this.i18n.currentLang + "&_erupt=" + eruptName;
    }

    //paginated data object
    queryEruptTableData(eruptName: string, url: string, page: Page, header?: object): Observable<Page> {
        return this._http.post(url, page, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                ...header
            }
        });
    }


    //tree data structure
    queryEruptTreeData(eruptName: string): Observable<Tree[]> {
        return this._http.get<Tree[]>(RestPath.data + "/tree/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //get data by id
    queryEruptDataById(eruptName: string, id: any): Observable<any> {
        return this._http.get<any>(RestPath.data + "/" + eruptName + "/" + id, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //get initialization data
    getInitValue(eruptName: string, eruptParentName?: string, header?: object): Observable<any> {
        return this._http.get<any>(RestPath.data + "/init-value/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || '',
                ...header
            }
        });
    }

    updateBoardGroup(eruptName: string, visCode: string, pk: any, groupValue: any): Observable<any> {
        return this._http.post(RestPath.dataModify + "/board/" + eruptName + "/update_group", {
            visCode, pk, groupValue
        }, {}, {
            observe: "body",
            headers: {erupt: eruptName}
        });
    }

    updateGanttDate(eruptName: string, visCode: string, pk: any, startDate: string, endDate: string): Observable<any> {
        return this._http.post(RestPath.dataModify + "/gantt/" + eruptName + "/update_date", {
            visCode: visCode, pk,
            startDate, endDate
        }, {}, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    updateCalendarDate(eruptName: string, visCode: string, pk: any, date: string, endDate?: string): Observable<any> {
        return this._http.post(RestPath.dataModify + "/calendar/" + eruptName + "/update_date", {
            visCode, pk, date, endDate
        }, {}, {
            observe: "body",
            headers: {erupt: eruptName}
        });
    }

    findAutoCompleteValue(eruptName: string, field: string, data: any, val: string, eruptParentName?: string): Observable<string[]> {
        return this._http.post(RestPath.comp + "/auto-complete/" + eruptName + "/" + field, data, {
            val: val.trim(),
        }, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
            }
        });
    }

    getCodeEditHints(eruptName: string, fieldName: string, eruptParentName?: string): Observable<string[]> {
        return this._http.get<string[]>(RestPath.comp + "/code-edit-hints/" + eruptName + "/" + fieldName, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
            }
        });
    }

    findChoiceItem(eruptName: string, field: string, eruptParentName?: string): Observable<VL[]> {
        return this._http.get<VL[]>(RestPath.component + "/choice-item/" + eruptName + "/" + field, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
            }
        });
    }

    findChoiceItemFilter(eruptName: string, field: string, data: object, eruptParentName?: string): Observable<VL[]> {
        return this._http.post(RestPath.component + "/choice-item-filter/" + eruptName + "/" + field, data, {}, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
            }
        });
    }

    findTagsItem(eruptName: string, field: string, formData: { [key: string]: any }, eruptParentName?: string): Observable<string[]> {
        return this._http.post<string[]>(RestPath.component + "/tags-item/" + eruptName + "/" + field, formData, null, {
            observe: "body",
            headers: {
                erupt: eruptName,
                eruptParent: eruptParentName || ''
            }
        });
    }


    findTabTree(eruptName: string, tabFieldName: string): Observable<Tree[]> {
        return this._http.get<Tree[]>(RestPath.data + "/tab/tree/" + eruptName + "/" + tabFieldName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    findCheckBox(eruptName: string, fieldName: string): Observable<Checkbox[]> {
        return this._http.get<Checkbox[]>(RestPath.data + "/" + eruptName + "/checkbox/" + fieldName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //custom button form initial values
    operatorFormValue(eruptName: string, operatorCode: string, ids: any): Observable<any> {
        return this._http.post(RestPath.data + "/" + eruptName + "/operator/" + operatorCode + "/form-value", null, {
            ids: ids
        }, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }


    //execute custom operator method
    execOperatorFun(eruptName: string, operatorCode: string, ids: any, param: object): Observable<EruptApiModel> {
        return this._http.post(RestPath.data + "/" + eruptName + "/operator/" + operatorCode, {
            ids: ids,
            param: param
        }, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    queryDependTreeData(eruptName: string) {
        return this._http.get<Tree[]>(RestPath.data + "/depend-tree/" + eruptName, null, {
            observe: "body",
            headers: {
                erupt: eruptName
            }
        });
    }

    //get reference-tree data
    queryReferenceTreeData(eruptName: string, refName: string, dependVal?: any, eruptParent?: string): Observable<Tree[]> {
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
        return this._http.get<Tree[]>(RestPath.data + "/" + eruptName + "/reference-tree/" + refName, param, {
            observe: "body",
            headers: header
        });
    }

    onChange(erupt: string, field: string, data: any) {
        return this._http.post<R<{
            formData: Record<string, any>,
            editExpr: Record<string, string>
        }>>(RestPath.erupt + "/data/onchange/" + erupt + "/" + field, data, null, {
            observe: "body",
            headers: {
                erupt: erupt
            }
        });
    }

    //add data
    addEruptData(eruptName: string, data: any, headers?: object): Observable<any> {
        return this._http.post<any>(RestPath.dataModify + "/" + eruptName, data, null, {
            observe: null,
            headers: {
                erupt: eruptName,
                ...headers
            }
        });
    }

    //update data
    updateEruptData(eruptName: string, data: object): Observable<any> {
        return this._http.post<EruptApiModel>(RestPath.dataModify + "/" + eruptName + "/update", data, null, {
            observe: null,
            headers: {
                erupt: eruptName
            }
        });
    }

    //delete data
    deleteEruptData(eruptName: string, id): Observable<EruptApiModel> {
        return this.deleteEruptDataList(eruptName, [id]);
    }

    //batch delete data
    deleteEruptDataList(eruptName: string, ids: any[]): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/" + eruptName + "/delete", ids, null, {
            headers: {
                erupt: eruptName
            }
        });
    }

    eruptDataValidate(eruptName: string, data: any, eruptParent?: string): Observable<EruptApiModel> {
        return this._http.post(RestPath.data + "/validate-erupt/" + eruptName, data, null, {
            headers: {
                erupt: eruptName,
                eruptParent: eruptParent || ""
            }
        });
    }

    eruptTabAdd(eruptName: string, tabName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/tab-add/" + eruptName + "/" + tabName, data, null, {
            headers: {
                erupt: eruptName
            }
        });
    }

    eruptTabUpdate(eruptName: string, tabName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/tab-update/" + eruptName + "/" + tabName, data, null, {
            headers: {
                erupt: eruptName
            }
        });
    }

    eruptTabDelete(eruptName: string, tabName: string, data: any): Observable<EruptApiModel> {
        return this._http.post(RestPath.dataModify + "/tab-delete/" + eruptName + "/" + tabName, data, null, {
            headers: {
                erupt: eruptName
            }
        });
    }

    //login
    login(account: string, pwd: string, verifyCode?: any, verifyCodeMark?: any): Observable<LoginModel> {
        return this._http.post(RestPath.erupt + "/login", {
                account, pwd, verifyCode,
                verifyCodeMark: verifyCodeMark || null
            }
        );
    }

    tenantLogin(tenantCode: string, account: string, pwd: string, verifyCode?: any, verifyCodeMark?: any): Observable<LoginModel> {
        return this._http.post(RestPath.erupt + "/tenant/login", {
                tenantCode, account, pwd, verifyCode,
                verifyCodeMark: verifyCodeMark || null
            }
        );
    }

    tenantChangePwd(pwd: string, newPwd: string, newPwd2: string): Observable<EruptApiModel> {
        const encode = (p: string) => EruptAppData.get().pwdTransferEncrypt ? this.pwdEncode(p, 3) : p;
        return this._http.post(RestPath.erupt + "/tenant/change-pwd", {
                pwd: encode(pwd),
                newPwd: encode(newPwd),
                newPwd2: encode(newPwd2)
            }
        );
    }

    tenantUserinfo(): Observable<Userinfo> {
        return this._http.get<Userinfo>(RestPath.erupt + "/tenant/userinfo");
    }

    logout(): Observable<any> {
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
        const encode = (p: string) => EruptAppData.get().pwdTransferEncrypt ? this.pwdEncode(p, 3) : p;
        return this._http.post(RestPath.erupt + "/change-pwd", {
                pwd: encode(pwd),
                newPwd: encode(newPwd),
                newPwd2: encode(newPwd2)
            }
        );
    }

    //get menu
    getMenu(): Observable<MenuVo[]> {
        return this._http.get<MenuVo[]>(RestPath.erupt + "/menu", null, {
            observe: "body"
        });
    }

    userinfo(): Observable<Userinfo> {
        return this._http.get<Userinfo>(RestPath.erupt + "/userinfo");
    }

    downloadExcelTemplate(eruptName: string, callback?) {
        this._http.get(RestPath.excel + "/template/" + eruptName, null, {
            responseType: "arraybuffer",
            observe: 'events',
            headers: {
                erupt: eruptName
            }
        }).subscribe((res) => {
            if (res.type !== 4) {
                // not ready yet, no action needed
                return;
            }
            downloadFile(res);
            callback();
        }, () => {
            callback();
        });
        // DataService.postExcelFile(RestPath.excel + "/template/" + eruptName + "?" + this.createAuthParam(eruptName));
    }

    downloadExcel(eruptName: string, body: any, header: any, callback: Function, ids?: any[]) {
        let url = RestPath.excel + "/export/" + eruptName;
        if (ids && ids.length > 0) {
            url += "?" + ids.map(id => "ids=" + id).join("&");
        }
        this._http.post(url, body, null, {
            responseType: "arraybuffer",
            observe: 'events',
            headers: {
                erupt: eruptName,
                ...header
            }
        }).subscribe((res) => {
            if (res.type !== 4) {
                return;
            }
            downloadFile(res);
            callback();
        }, () => {
            callback();
        });
    }

    createAuthParam(eruptName: string): string {
        return DataService.PARAM_ERUPT + "=" + eruptName + "&" + DataService.PARAM_TOKEN + "=" + this.tokenService.get().token;
    }

    getFieldTplPath(eruptName: string, fieldName: string): string {
        return RestPath.tpl + "/" + "html-field/" + eruptName + "/" + fieldName + "?_token=" + this.tokenService.get().token + "&_erupt=" + eruptName;
    }

    noticeChannels() {
        return this._http.get<R<NoticeChannel[]>>(RestPath.erupt + "/notice/channels");
    }

    noticeScenes() {
        return this._http.get<R<NoticeScene[]>>(RestPath.erupt + "/notice/scenes");
    }


    noticeMessages(page: number, size: number, search: string, status: NoticeStatus, scene: number) {
        return this._http.get<R<SimplePage<NoticeMessageDetail>>>(RestPath.erupt + "/notice/messages", {
            page,
            size,
            [search ? 'search' : '']: search,
            [status ? 'status' : '']: status,
            [scene ? 'scene' : '']: scene,
        });
    }

    noticeMessageDetail(id: number) {
        return this._http.get<R<NoticeMessageDetail>>(RestPath.erupt + "/notice/message-detail", {
            id
        });
    }

    noticeUnreadCount() {
        return this._http.get<R<number>>(RestPath.erupt + "/notice/unread-count");
    }

    noticeReadAllCount() {
        return this._http.get<R<void>>(RestPath.erupt + "/notice/read-all");
    }

    announcement(page: number, size: number, search: string) {
        return this._http.get<R<SimplePage<Announcement>>>(RestPath.erupt + "/announcement/list", {
            page,
            size,
            [search ? 'search' : '']: search
        });
    }

    announcementPopups() {
        return this._http.get<R<Announcement[]>>(RestPath.erupt + "/announcement/popups");
    }

    announcementMarkRead(id: number) {
        return this._http.get<R<void>>(RestPath.erupt + "/announcement/mark-read/" + id);
    }

    printTemplates() {
        return this._http.get<R<{ name: string, content: string }[]>>(RestPath.erupt + "/print/templates");
    }

    printVars() {
        return this._http.get<R<VL[]>>(RestPath.erupt + "/print/vars");
    }

    printConfigList(eruptName: string) {
        return this._http.get<R<{ id: number, erupt: string, title: string, content: string, pageConfig: any }[]>>(
            RestPath.erupt + "/print/config/" + eruptName + "/list", null, {
                observe: "body", headers: {erupt: eruptName}
            });
    }

    printConfigAdd(eruptName: string, config: any) {
        return this._http.post<R<void>>(
            RestPath.erupt + "/print/config/" + eruptName + "/add", config);
    }

    printConfigUpdate(eruptName: string, config: any) {
        return this._http.post<R<void>>(
            RestPath.erupt + "/print/config/" + eruptName + "/update", config);
    }

    printConfigDelete(eruptName: string, id: number) {
        return this._http.post<R<void>>(
            RestPath.erupt + "/print/config/" + eruptName + "/delete?id=" + id, null);
    }

    renderPrint(eruptName: string, id: any, content: string) {
        return this._http.post<R<string>>(
            RestPath.erupt + "/print/" + eruptName + "/" + id, content, null, {
                observe: "body", headers: {erupt: eruptName}
            });
    }

    getFormViewData(eruptName: string): Observable<any> {
        return this._http.get<any>(RestPath.formView + "/" + eruptName, null, {
            observe: "body",
            headers: {erupt: eruptName}
        });
    }

    saveFormViewData(eruptName: string, data: any): Observable<EruptApiModel> {
        return this._http.post<EruptApiModel>(RestPath.formView + "/" + eruptName, data, null, {
            observe: "body",
            headers: {erupt: eruptName}
        });
    }

}
