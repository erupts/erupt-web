import {Injectable} from "@angular/core";
import {I18NService} from "@core";
import {Observable} from "rxjs";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {FlowConfig, FlowGroup} from "@flow/model/flow.model";
import {R} from "@shared/model/api.model";

@Injectable()
export class FlowApiService {

    constructor(private _http: _HttpClient,
                private i18n: I18NService) {

    }

    groupList(): Observable<R<FlowGroup[]>> {
        return this._http.get<R<FlowGroup[]>>(RestPath.erupt + "/flow/group/list", null, {
            observe: "body",
        });
    }

    groupAdd(name: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/group/add", null, {
            name
        });
    }

    groupEdit(id: number, name: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/group/edit", null, {
            id, name
        });
    }

    groupDelete(id: number): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/group/delete", null, {
            id
        });
    }

    groupSort(ids: number[]): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/group/sort", ids);
    }

    configList(): Observable<R<FlowConfig[]>> {
        return this._http.get<R<FlowConfig[]>>(RestPath.erupt + "/flow/config/list", null);
    }


}
