/**
 * Created by liyuepeng on 10/17/18.
 */
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EruptModel, Tree} from "../model/erupt.model";
import {Observable} from "rxjs/Observable";
import {Page} from "../model/page";
import {_HttpClient} from "@delon/theme";

@Injectable()
export class DataService {

    domain: string = window["domain"];

    eruptHeaderKey: String = "erupt";


    constructor(private http: HttpClient, private _http: _HttpClient) {
    }

    getEruptBuild(model: string): Observable<EruptModel> {
        return this.http.get<EruptModel>(this.domain + '/erupt-api/build/list/' + model, {
            headers: {
                eruptKey: model
            }
        });
    }

    queryEruptData(model: string, condition: any): Observable<Page> {
        return this.http.post<Page>(this.domain + '/erupt-api/data/table/' + model, {
            condition: condition
        }, {
            headers: {
                eruptKey: model
            }
        });
    }

    queryEruptTreeData(model: string): Observable<Array<Tree>> {
        return this.http.post<Array<Tree>>(this.domain + '/erupt-api/data/tree/' + model, {}, {
            headers: {
                eruptKey: model
            }
        });
    }

    execOperatorFun(model: string, operatorCode: string, keys: any, param: any) {
        return this.http.post<Page>(this.domain + '/erupt-api/data/' + model + '/operator/' + operatorCode, {
            keys,
            param
        }, {
            headers: {
                eruptKey: model
            }
        });
    }

    queryEruptReferenceData(model: string, refName: string): Observable<any> {
        return this.http.get(this.domain + "/erupt-api/data/" + model + "/ref/" + refName, {
            headers: {
                eruptKey: model
            }
        });
    }

    addEruptData(model: string, data: any): Observable<any> {
        return this.http.post(this.domain + "/erupt-api/data/" + model, data, {
            headers: {
                eruptKey: model
            }
        });
    }

    deleteEruptData(model: string, id): Observable<any> {
        return this.http.delete(this.domain + '/erupt-api/data/' + model + "/" + id, {
            headers: {
                eruptKey: model
            }
        });
    }

    downloadEruptExcel(model: string): Observable<any> {
        return this.http.get(this.domain + '/erupt-api/excel/' + model, {
            headers: {
                eruptKey: model
            }
        });
    }
}
