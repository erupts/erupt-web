import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {RestPath} from '../erupt/model/erupt.enum';
import {EruptApiModel} from '../erupt/model/erupt-api.model';

/** One registered module, as the module center lists it. */
export interface ModuleVo {
    name: string;
    group: string | null;
    description: string | null;
    /** May hold a {lang} placeholder for the reader's language */
    docs: string | null;
    /** Null when the module declares no menu */
    menus: number | null;
    /** Null when the module cannot be switched off */
    enabled: boolean | null;
}

/** The module center API: every call is checked against the page's menu on the server. */
@Injectable({providedIn: 'root'})
export class ModuleCenterService {

    static readonly base = RestPath.erupt + '/modules';

    constructor(private _http: _HttpClient) {
    }

    modules(): Observable<ModuleVo[]> {
        return this._http.get<ModuleVo[]>(ModuleCenterService.base);
    }

    enabled(name: string, value: boolean): Observable<EruptApiModel> {
        return this._http.post<EruptApiModel>(ModuleCenterService.base + '/' + name + '/enabled', null, {value});
    }

}
