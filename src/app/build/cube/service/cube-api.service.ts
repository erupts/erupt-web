import {Injectable} from "@angular/core";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {R} from "@shared/model/api.model";
import {CubeMeta} from "../cube/cube.model";
import {Dashboard} from "../cube/dashboard.model";

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


}
