import {Injectable} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {FlowInstance, FlowInstanceComment, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {NodeRule} from "@flow/model/node.model";
import {FlowConfig} from "@flow/model/flow.model";

@Injectable({
    providedIn: 'root'
})
export class FlowInstanceApiService {

    constructor(private _http: _HttpClient) {

    }

    userFlows(): Observable<R<FlowConfig[]>> {
        return this._http.get<R<FlowConfig[]>>(RestPath.erupt + "/flow/instance/user-flows", null);
    }

    create(flowId: number, data: object): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/create", data, {
            flowId
        });
    }

    todoList(): Observable<R<FlowInstanceTask[]>> {
        return this._http.get<R<FlowInstanceTask[]>>(RestPath.erupt + "/flow/instance/approval/list/todo")
    }

    doneList(): Observable<R<FlowInstanceTask[]>> {
        return this._http.get<R<FlowInstanceTask[]>>(RestPath.erupt + "/flow/instance/approval/list/done")
    }

    ccList(): Observable<R<FlowInstanceTask[]>> {
        return this._http.get<R<FlowInstanceTask[]>>(RestPath.erupt + "/flow/instance/approval/list/cc")
    }

    createdList(): Observable<R<FlowInstanceTask[]>> {
        return this._http.get<R<FlowInstanceTask[]>>(RestPath.erupt + "/flow/instance/approval/list/created")
    }

    detail(instanceId: number): Observable<R<FlowInstance>> {
        return this._http.get<R<FlowInstance>>(RestPath.erupt + "/flow/instance/detail", {
            instanceId
        })
    }

    eruptData(instanceId: number): Observable<R<object>> {
        return this._http.get<R<FlowInstance>>(RestPath.erupt + "/flow/instance/erupt-data", {
            instanceId
        })
    }


    tasks(instanceId: number): Observable<R<FlowInstanceTask[]>> {
        return this._http.get<R<FlowInstanceTask[]>>(RestPath.erupt + "/flow/instance/tasks", {
            instanceId
        })
    }

    taskNodeInfo(instanceTaskId: number): Observable<R<NodeRule>> {
        return this._http.get<R<NodeRule>>(RestPath.erupt + "/flow/instance/approval/task-node-info", {
            instanceTaskId
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

    agree(instanceTaskId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/agree", null, {
            instanceTaskId,
            comment
        })
    }

    refuse(instanceTaskId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/refuse", null, {
            instanceTaskId,
            comment
        })
    }

    cc(instanceTaskId: number, userIds: number[], comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/cc", null, {
            instanceTaskId,
            comment,
            userIds
        })
    }

    transfer(instanceTaskId: number, userId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/transfer", null, {
            instanceTaskId,
            comment
        })
    }

    addSign(instanceTaskId: number, addSignType: 'PRE_SIGN' | 'POST_SIGN', userId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/add-sign", null, {
            instanceTaskId,
            comment
        })
    }

    rollback(instanceTaskId: number, rtnNode: string, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/rollback", null, {
            instanceTaskId,
            comment
        })
    }

}
