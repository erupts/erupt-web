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
                eruptHeaderKey: model
            }
        });
    }

    queryEruptData(model: string, condition: any): Observable<Page> {
        return this.http.post<Page>(this.domain + '/erupt-api/data/table/' + model, {
            condition: condition
        }, {
            headers: {
                eruptHeaderKey: model
            }
        });
    }

    queryEruptTreeData(model: string): Observable<Array<Tree>> {
        return this.http.post<Array<Tree>>(this.domain + '/erupt-api/data/tree/' + model, {}, {
            headers: {
                eruptHeaderKey: model
            }
        });
    }

    execOperatorFun(model: string, operatorCode: string, keys: any, param: any) {
        return this.http.post<Page>(this.domain + '/erupt-api/data/' + model + '/operator/' + operatorCode, {
            keys,
            param
        }, {
            headers: {
                eruptHeaderKey: model
            }
        });
    }

    queryEruptReferenceData(model: string, refName: string): Observable<any> {
        return this.http.get(this.domain + "/erupt-api/data/" + model + "/ref/" + refName, {
            headers: {
                eruptHeaderKey: model
            }
        });
    }

    addEruptData(model: string, data: any): Observable<any> {
        return this.http.post(this.domain + "/erupt-api/data/" + model, data, {
            headers: {
                eruptHeaderKey: model
            }
        });
    }

    deleteEruptData(model: string, id): Observable<any> {
        return this.http.delete(this.domain + '/erupt-api/data/' + model + "/" + id);
    }
}
