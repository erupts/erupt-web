import {Inject, Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Bi, BiData, Reference} from "../model/bi.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {_HttpClient, MenuService} from "@delon/theme";
import {DataService} from "@shared/service/data.service";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {downloadFile} from "@shared/util/erupt.util";

@Injectable({
    providedIn: 'root'
})
export class BiDataService {

    constructor(private _http: _HttpClient,
                private menuSrv: MenuService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

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
        return this._http.post(RestPath.bi + "/data/" + code, query, {
            index: index,
            size: size
        }, {
            headers: {
                erupt: code
            }
        });
    }

    //图表
    getBiChart(code: string, chartId: number, query: any): Observable<Map<String, any>[]> {
        return this._http.post(RestPath.bi + "/" + code + "/chart/" + chartId, query, null, {
            headers: {
                erupt: code
            }
        });
    }

    //维度参照
    getBiReference(code: string, id: number, query: any): Observable<Reference[]> {
        return this._http.post(RestPath.bi + "/" + code + "/reference/" + id, query || {}, null, {
            headers: {
                erupt: code
            }
        });
    }

    //导出excel
    exportExcel_bak(id: number, code: string, query: any) {
        DataService.postExcelFile(RestPath.bi + "/" + code + "/excel/" + id, {
            condition: encodeURIComponent(JSON.stringify(query)),
            [DataService.PARAM_ERUPT]: code,
            [DataService.PARAM_TOKEN]: this.tokenService.get().token
        });
    }

    exportExcel(id: number, code: string, query: any, callback) {
        this._http.post(RestPath.bi + "/" + code + "/excel/" + id, query, null, {
            responseType: "arraybuffer",
            observe: 'events',
            headers: {
                erupt: code,
            }
        }).subscribe((res) => {
            if (res.type !== 4) {
                // 还没准备好，无需处理
                return;
            }
            downloadFile(res);
            callback();
        }, () => {
            callback();
        });
    }

    //加载自定义图表
    getChartTpl(id: number, code: string, query: any): string {
        return RestPath.bi + "/" + code + "/custom-chart/" + id + "?_token=" + this.tokenService.get().token + "&_erupt=" + code +
            "&condition=" + encodeURIComponent(JSON.stringify(query));
    }
}
