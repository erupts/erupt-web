import {Injectable} from "@angular/core";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {FlowGroup} from "@flow/model/flow.model";
import {R} from "@shared/model/api.model";

@Injectable()
export class CubeApiService {

    constructor(private _http: _HttpClient) {

    }

    dashboardList() {
        return this._http.get<R<FlowGroup[]>>(RestPath.erupt + "/cube/dashboard/list", {});
    }

    dashboardDetail(code: string) {
        return this._http.get<R<void>>(RestPath.erupt + "/cube/dashboard/detail", code);
    }

    delete(code: string) {
        return this._http.post<R<void>>(RestPath.erupt + "/cube/dashboard/delete", code);
    }


}
