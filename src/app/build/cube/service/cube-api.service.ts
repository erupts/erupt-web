import {Injectable} from "@angular/core";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {R} from "@shared/model/api.model";
import {CubeMeta} from "../model/cube.model";
import {Dashboard, DashboardDSL, DashboardPublishHistory} from "../model/dashboard.model";
import {CubeQuery} from "../model/cube-query.model";
import {VL} from "../../erupt/model/erupt-field.model";

@Injectable()
export class CubeApiService {

    constructor(private _http: _HttpClient) {

    }

    dashboardDetail(code: string) {
        return this._http.get<R<Dashboard>>(RestPath.erupt + "/cube/dashboard/detail/" + code);
    }

    sources() {
        return this._http.get<R<VL[]>>(RestPath.erupt + "/cube/semantic/sources");
    }

    cubes(source?: string) {
        return this._http.get<R<VL[]>>(RestPath.erupt + "/cube/semantic/cubes", this.sourceParams(source));
    }

    explores(cube: string, source?: string) {
        return this._http.get<R<VL[]>>(RestPath.erupt + "/cube/semantic/" + cube + "/explores", this.sourceParams(source));
    }

    cubeMetadata(cube: string, explore: string, source?: string) {
        return this._http.get<R<CubeMeta>>(RestPath.erupt + "/cube/semantic/metadata/" + cube + "/" + explore, this.sourceParams(source));
    }

    updateDsl(id: number, dsl: DashboardDSL) {
        return this._http.post<R<void>>(RestPath.erupt + "/cube/dashboard/update-dsl/" + id, dsl);
    }

    query(cubeQuery: CubeQuery, source?: string) {
        return this._http.post<R<Record<string, any>[]>>(RestPath.erupt + "/cube/semantic/query", cubeQuery, this.sourceParams(source));
    }

    parameterItems(cube: string, parameter: string, source?: string) {
        return this._http.get<R<VL[]>>(RestPath.erupt + "/cube/semantic/parameter-items/" + cube + "/" + parameter, this.sourceParams(source));
    }

    private sourceParams(source?: string): Record<string, string> {
        return source ? {source} : {};
    }

    publish(id: number, description: string) {
        return this._http.get<R<void>>(RestPath.erupt + "/cube/dashboard/publish-dsl/" + id, {
            description
        });
    }

    maps() {
        return this._http.get<R<{ code: string; name: string; url: string }[]>>(RestPath.erupt + "/cube/dashboard/maps");
    }

    publishHistory(id: number) {
        return this._http.get<R<DashboardPublishHistory[]>>(RestPath.erupt + "/cube/dashboard/publish-history/" + id);
    }

    rollback(id: number, historyId: number) {
        return this._http.get<R<void>>(RestPath.erupt + "/cube/dashboard/rollback-dsl/" + id, {
            historyId
        });
    }

}
