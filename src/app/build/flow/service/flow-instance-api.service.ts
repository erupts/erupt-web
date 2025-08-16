import {Injectable} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {FlowInstance} from "@flow/model/approval.model";

@Injectable({
    providedIn: 'root'
})
export class FlowInstanceApiService {

    constructor(private _http: _HttpClient) {

    }

    create(flowId: number, data: object): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/create", data, {
            flowId
        });
    }

    todoList():Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/todo")
    }

    doneList():Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/done")
    }

    ccList():Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/cc")
    }

    createdList():Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/created")
    }

}
