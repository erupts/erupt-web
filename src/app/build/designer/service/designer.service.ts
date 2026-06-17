import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {_HttpClient} from "@delon/theme";
import {RestPath} from "../../erupt/model/erupt.enum";
import {EruptBuildModel} from "../../erupt/model/erupt-build.model";
import {KV} from "../../erupt/model/util.model";
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

    // Convert design JSON to a disguised EruptModel (standard EruptBuildModel through real render pipeline)
    preview(form: DesignerForm): Observable<EruptBuildModel> {
        return this._http.post<EruptBuildModel>(this.path + "/preview", this.pruneKey(form), null, {observe: "body"});
    }

    // Export @Erupt annotated entity source code for annotation-based development
    javaCode(form: DesignerForm): Observable<R<string>> {
        return this._http.post<R<string>>(this.path + "/java-code", this.pruneKey(form), null, {observe: "body"});
    }

    // Registered Erupt models for reference-type field linking (key=class name, value=feature name)
    erupts(): Observable<R<KV<string, string>[]>> {
        return this._http.get<R<KV<string, string>[]>>(this.path + "/erupts", null, {observe: "body"});
    }

    // Load persisted design config
    getConfig(className: string): Observable<R<{ className: string; name: string; config: string }>> {
        return this._http.get<R<{ className: string; name: string; config: string }>>(
            this.path + "/config/" + className, null, {observe: "body"});
    }

    // Publish: save design and register runtime Erupt model without restart
    publish(className: string, form: DesignerForm): Observable<R<void>> {
        return this._http.post<R<void>>(this.path + "/publish/" + className, this.pruneKey(form), null, {observe: "body"});
    }

    // Get field kv (key=fieldName, value=title) of a registered Erupt class for reference-type dropdown options
    eruptFields(eruptName: string): Observable<R<KV<string, string>[]>> {
        return this._http.get<R<KV<string, string>[]>>(this.path + "/erupt-fields/" + eruptName, null, {observe: "body"});
    }

    // Strip frontend-only key fields from fields and vis entries before sending
    private pruneKey(form: DesignerForm): DesignerForm {
        return {
            ...form,
            erupt: {...form.erupt, vis: form.erupt.vis?.map(v => ({...v, key: undefined}))},
            fields: form.fields.map(f => ({...f, key: undefined}))
        };
    }

}
