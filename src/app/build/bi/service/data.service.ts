import {Inject, Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Bi, BiData, Reference} from "../model/bi.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient} from "@delon/theme";
import {EruptFieldModel} from "../../erupt/model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Injectable({
    providedIn: 'root'
})
export class BiDataService {

    constructor(private _http: _HttpClient, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    /**
     * BI
     * @param code
     */
    //BI结构
    getBiBuild(code: string): Observable<Bi> {
        return this._http.get<any>(RestPath.bi + "/" + code, null, {
            observe: "body",
            headers: {
                erupt: code
            }
        });
    }

    //BI数据
    getBiData(code: string, index: number, size: number, query: any): Observable<BiData> {
        return this._http.post(RestPath.bi + "/" + code + "/data", query, {
            index: index,
            size: size
        }, {
            headers: {
                erupt: code
            }
        });
    }

    //图表
    getBiChart(code: string, chart: string, query: any): Observable<Map<String, any>[]> {
        return this._http.post(RestPath.bi + "/" + code + "/chart/" + chart, query, null, {
            headers: {
                erupt: code
            }
        });
    }

    //导出excel
    exportExcel(code: string, query: any) {
        DataService.postExcelFile(RestPath.bi + "/" + code + "/excel", {
            condition: encodeURIComponent(JSON.stringify(query)),
            [DataService.PARAM_ERUPT]: code,
            [DataService.PARAM_TOKEN]: this.tokenService.get().token
        });
    }


    //维度参照
    getBiReference(code: string, dim: string, query: any): Observable<Reference[]> {
        return this._http.post(RestPath.bi + "/" + code + "/reference/" + dim, query, null, {
            headers: {
                erupt: code
            }
        });
    }
}
