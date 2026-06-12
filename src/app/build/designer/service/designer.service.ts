import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {_HttpClient} from "@delon/theme";
import {RestPath} from "../../erupt/model/erupt.enum";
import {EruptBuildModel} from "../../erupt/model/erupt-build.model";
import {DesignerForm} from "../model/designer.model";

export interface R<T> {
    success: boolean;
    message: string;
    data: T;
}

@Injectable()
export class DesignerService {

    private readonly path: string = RestPath.erupt + "/designer";

    constructor(private _http: _HttpClient) {
    }

    // 设计 JSON → 伪装注解 EruptModel（标准 EruptBuildModel，走真实渲染管线）
    preview(form: DesignerForm): Observable<EruptBuildModel> {
        return this._http.post<EruptBuildModel>(this.path + "/preview", this.pruneKey(form), null, {observe: "body"});
    }

    // 导出 @Erupt 注解实体类源码，引导进入注解开发
    javaCode(form: DesignerForm): Observable<R<string>> {
        return this._http.post<R<string>>(this.path + "/java-code", this.pruneKey(form), null, {observe: "body"});
    }

    // 已注册的 Erupt 模型名，供引用类字段选择关联模型
    erupts(): Observable<R<string[]>> {
        return this._http.get<R<string[]>>(this.path + "/erupts", null, {observe: "body"});
    }

    // 加载持久化的设计配置
    getConfig(className: string): Observable<R<{ className: string; name: string; config: string }>> {
        return this._http.get<R<{ className: string; name: string; config: string }>>(
            this.path + "/config/" + className, null, {observe: "body"});
    }

    // 发布：保存设计并注册运行时 Erupt 模型，免重启生效
    publish(className: string, form: DesignerForm): Observable<R<void>> {
        return this._http.post<R<void>>(this.path + "/publish/" + className, this.pruneKey(form), null, {observe: "body"});
    }

    // 去除仅前端使用的 key 属性
    private pruneKey(form: DesignerForm): DesignerForm {
        return {...form, fields: form.fields.map(f => ({...f, key: undefined}))};
    }

}
