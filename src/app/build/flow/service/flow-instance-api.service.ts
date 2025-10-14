import {Injectable} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {ApprovalView, FlowInstance, FlowInstanceComment, FlowInstanceDataHistory, FlowInstanceTask, FlowTurn} from "@flow/model/flow-instance.model";
import {NodeRule} from "@flow/model/node.model";
import {FlowConfig} from "@flow/model/flow.model";
import {AddSignType, ApprovalQuery} from "@flow/model/fllw-approval.model";

@Injectable({
    providedIn: 'root'
})
export class FlowInstanceApiService {

    constructor(private _http: _HttpClient) {

    }

    progress(instanceId: number) {
        return this._http.get<R<Record<string, FlowTurn>>>(RestPath.erupt + "/flow/instance/progress", {
            instanceId
        })
    }

    userFlows(): Observable<R<FlowConfig[]>> {
        return this._http.get<R<FlowConfig[]>>(RestPath.erupt + "/flow/instance/user-flows", null);
    }

    create(flowId: number, data: object): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/create", data, {
            flowId
        });
    }

    list(query: ApprovalQuery): Observable<R<FlowInstance[]>> {
        return this._http.post<R<FlowInstance[]>>(RestPath.erupt + "/flow/instance/list", query)
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

    currTask(instanceId: number, approvalView: ApprovalView): Observable<R<FlowInstanceTask>> {
        return this._http.get<R<FlowInstanceTask>>(RestPath.erupt + "/flow/instance/curr-task", {
            instanceId,
            approvalView
        })
    }

    taskNodeInfo(taskId: number): Observable<R<NodeRule>> {
        return this._http.get<R<NodeRule>>(RestPath.erupt + "/flow/instance/task-node-info", {
            taskId
        })
    }

    commentList(instanceId: number): Observable<R<FlowInstanceComment[]>> {
        return this._http.get<R<FlowInstanceComment[]>>(RestPath.erupt + "/flow/instance/comment/list", {
            instanceId
        })
    }

    updateData(instanceId: number, data: object): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/update-data", data, {
            instanceId
        })
    }

    dataHistories(instanceId: number): Observable<R<FlowInstanceDataHistory[]>> {
        return this._http.get<R<FlowInstanceDataHistory[]>>(RestPath.erupt + "/flow/instance/data-histories", {
            instanceId
        })
    }

    commentCreate(instanceId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/comment/create", null, {
            instanceId,
            comment
        })
    }

    withdraw(instanceId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/withdraw", null, {
            instanceId,
            comment
        })
    }

    urge(instanceId: number, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/urge", null, {
            instanceId,
            comment
        })
    }

    agree(instanceTaskId: number, comment: string, signature: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/agree", {
            comment,
            signature
        }, {
            instanceTaskId,
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
            comment,
            userId
        })
    }

    addSign(instanceTaskId: number, addSignType: AddSignType, userIds: number[], comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/add-sign", null, {
            instanceTaskId,
            comment,
            addSignType,
            userIds
        })
    }

    rollback(instanceTaskId: number, rtnNode: string, comment: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/instance/approval/rollback", null, {
            instanceTaskId,
            comment
        })
    }

}
