import {Injectable} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../erupt/model/erupt.enum";
import {KV} from "../../erupt/model/util.model";

@Injectable()
export class FlowUpmsApiService {

    constructor(private _http: _HttpClient) {
    }

    posts(): Observable<R<KV<number, string>[]>> {
        return this._http.get<R<KV<number, string>[]>>(RestPath.erupt + "/flow/upms/posts")
    }

    roles(): Observable<R<KV<number, string>[]>> {
        return this._http.get<R<KV<number, string>[]>>(RestPath.erupt + "/flow/upms/roles")
    }

    users(): Observable<R<KV<number, string>[]>> {
        return this._http.get<R<KV<number, string>[]>>(RestPath.erupt + "/flow/upms/users")
    }


}
