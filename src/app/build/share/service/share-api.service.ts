import {Injectable} from "@angular/core";
import {_HttpClient} from "@delon/theme";
import {Observable} from "rxjs";
import {RestPath} from "../../erupt/model/erupt.enum";
import {R} from "@shared/model/api.model";

export interface ShareMeta {
    title: string;
    type: "FORM" | "PAGE";
    requirePassword: boolean;
    issuer: string;
    available: boolean;
    reason: string;
}

export interface ShareSession {
    token: string;
    route: string;
    expireMinutes: number;
}

// The two public calls of erupt-share; everything after them uses the minted token
@Injectable({providedIn: "root"})
export class ShareApiService {

    constructor(private _http: _HttpClient) {
    }

    meta(code: string): Observable<R<ShareMeta>> {
        return this._http.get<R<ShareMeta>>(RestPath.share + "/meta/" + encodeURIComponent(code), null, {observe: "body"});
    }

    exchange(code: string, password: string | null): Observable<R<ShareSession>> {
        return this._http.post<R<ShareSession>>(RestPath.share + "/exchange/" + encodeURIComponent(code), {password}, null, {observe: "body"});
    }
}
