import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Bi, BiData} from "../model/bi.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";

@Injectable({
    providedIn: 'root'
})
export class BiDataService {

    constructor(private _http: _HttpClient) {
    }

    /**
     * BI
     * @param code
     */
    //BI结构
    getBiBuild(code: string): Observable<Bi> {
        return this._http.get<any>(RestPath.bi + code, null, {
            observe: "body",
            headers: {
                erupt: code
            }
        });
    }

    //BI数据
    getBiData(code: string, query: any): Observable<BiData> {
        return this._http.post(RestPath.bi + code + "/data", query, null, {
            headers: {
                erupt: code
            }
        });
    }

    //图表
    getBiChart(code: string, chart: string, query: any) {
        return this._http.post(RestPath.bi + code + "/chart/" + chart, query, null, {
            headers: {
                erupt: code
            }
        });
    }

    //维度参照
    getBiReference(code: string, dim: string, query: any) {
      return this._http.post(RestPath.bi + code + "/reference/" + dim, query, null, {
        headers: {
          erupt: code
        }
      });
    }
}
