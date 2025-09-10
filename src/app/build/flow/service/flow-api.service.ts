import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {FlowConfig, FlowGroup} from "@flow/model/flow.model";
import {R} from "@shared/model/api.model";
import {VL} from "../../erupt/model/erupt-field.model";
import {EruptBuildModel} from "../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {NodeRule} from "@flow/model/node.model";

@Injectable()
export class FlowApiService {

    constructor(private _http: _HttpClient) {

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

    eruptFlows(): Observable<R<VL[]>> {
        return this._http.get<R<VL[]>>(RestPath.erupt + "/flow/flex/erupts");
    }

    eruptFlowBuild(erupt: string): Observable<R<EruptBuildModel>> {
        return this._http.get<R<EruptBuildModel>>(RestPath.erupt + "/flow/flex/erupt-build/" + erupt);
    }

    flexEruptFlowBuild(erupt: string): Observable<R<EruptBuildModel>> {
        return this._http.get<R<EruptBuildModel>>(RestPath.erupt + "/flow/flex/flex-erupt-build/" + erupt);
    }

    flexNodes(): Observable<R<FlexNodeModel[]>> {
        return this._http.get<R<FlexNodeModel[]>>(RestPath.erupt + "/flow/flex/flex-nodes");
    }


    configList(): Observable<R<FlowConfig[]>> {
        return this._http.get<R<FlowConfig[]>>(RestPath.erupt + "/flow/config/list", null);
    }

    configCreate(config: FlowConfig): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/config/create", config);
    }

    configUpdate(config: FlowConfig): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/config/update", config);
    }

    configCopy(id: number): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/config/copy", null, {
            id
        });
    }

    configDelete(id: number): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/config/delete", null, {
            id
        });
    }

    configSwitchEnable(id: number): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + "/flow/config/switch-enable", null, {
            id
        });
    }

    configGet(id: number): Observable<R<FlowConfig>> {
        return this._http.get<R<FlowConfig>>(RestPath.erupt + "/flow/config/get/" + id);
    }

    ruleCheck(rule: NodeRule[]): Observable<R<NodeRule[]>> {
        return this._http.post<R<NodeRule[]>>(RestPath.erupt + "/flow/config/rule-check", rule);
    }

}
