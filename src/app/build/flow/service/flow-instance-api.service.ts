import {Injectable} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {FlowInstance, FlowInstanceComment, FlowInstanceTask} from "@flow/model/approval.model";
import {NodeRule} from "@flow/model/node.model";

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

    todoList(): Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/todo")
    }

    doneList(): Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/done")
    }

    ccList(): Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/cc")
    }

    createdList(): Observable<R<FlowInstance[]>> {
        return this._http.get<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/approval/list/created")
    }

    detail(instanceId: number): Observable<R<FlowInstance>> {
        return this._http.get<R<FlowInstance>>(RestPath.erupt + "/flow/instance/detail", {
            instanceId
        })
    }

    tasks(instanceId: number): Observable<R<FlowInstanceTask[]>> {
        return this._http.get<R<FlowInstanceTask[]>>(RestPath.erupt + "/flow/instance/tasks", {
            instanceId
        })
    }

    nodeInfo(instanceId: number): Observable<R<NodeRule>> {
        return this._http.get<R<NodeRule>>(RestPath.erupt + "/flow/instance/node-info", {
            instanceId
        })
    }

    commentList(instanceId: number): Observable<R<FlowInstanceComment[]>> {
        return this._http.get<R<FlowInstanceComment[]>>(RestPath.erupt + "/flow/instance/comment/list", {
            instanceId
        })
    }

    commentCreate(instanceId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/comment/create", null, {
            instanceId,
            comment
        })
    }


}
