import {Injectable} from "@angular/core";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {R} from "@shared/model/api.model";
import {CubeMeta} from "../model/cube.model";
import {Dashboard, DashboardDSL} from "../model/dashboard.model";
import {CubeQuery, CubeQueryResponse} from "../model/cube-query.model";

@Injectable()
export class CubeApiService {

    constructor(private _http: _HttpClient) {

    }

    dashboardDetail(code: string) {
        return this._http.get<R<Dashboard>>(RestPath.erupt + "/cube/dashboard/detail/" + code);
    }

    cubeMetadata(cube: string, explore: string) {
        return this._http.get<R<CubeMeta>>(RestPath.erupt + "/cube/semantic/metadata/" + cube + "/" + explore);
    }

    updateDsl(id: number, dsl: DashboardDSL) {
        return this._http.post<R<void>>(RestPath.erupt + "/cube/dashboard/update-dsl/" + id, dsl);
    }

    query(cubeQuery: CubeQuery) {
        return this._http.post<R<Record<string, CubeQueryResponse>[]>>(RestPath.erupt + "/cube/semantic/query", cubeQuery);
    }

}
