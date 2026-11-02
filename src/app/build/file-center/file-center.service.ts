import {Inject, Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {Observable} from 'rxjs';
import {RestPath} from '../erupt/model/erupt.enum';
import {EruptApiModel} from '../erupt/model/erupt-api.model';

/** One row of a listing, as erupt-file-center returns it. */
export interface FileEntry {
    name: string;
    path: string;
    dir: boolean;
    size: number;
    modified: number | null;
    contentType: string | null;
}

export interface FileCenterInfo {
    stores: string[];
    writable: boolean;
    textPreviewBytes: number;
}

/** The erupt-file-center API: every call is checked against the page's menu on the server. */
@Injectable({providedIn: 'root'})
export class FileCenterService {

    static readonly base = RestPath.erupt + '/file-center';

    constructor(private _http: _HttpClient,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    info(): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(FileCenterService.base + '/info');
    }

    list(store: string, path: string): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(FileCenterService.base + '/list', {store, path});
    }

    stat(store: string, path: string): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(FileCenterService.base + '/stat', {store, path});
    }

    /** The file itself, for an img / video / iframe: the token travels as a parameter. */
    rawUrl(store: string, path: string, download: boolean = false): string {
        const token = this.tokenService.get()?.token || '';
        return FileCenterService.base + '/raw?store=' + encodeURIComponent(store) + '&path=' + encodeURIComponent(path)
            + '&_token=' + encodeURIComponent(token) + (download ? '&download=true' : '');
    }

    text(store: string, path: string): Observable<string> {
        return this._http.get(this.rawUrl(store, path), null, {responseType: 'text'});
    }

    upload(store: string, dir: string, files: File[]): Observable<EruptApiModel> {
        const form = new FormData();
        files.forEach(file => form.append('files', file));
        return this._http.post<EruptApiModel>(FileCenterService.base + '/upload', form, {store, path: dir});
    }

    mkdir(store: string, dir: string, name: string): Observable<EruptApiModel> {
        return this._http.post<EruptApiModel>(FileCenterService.base + '/mkdir', null, {store, path: dir, name});
    }

    rename(store: string, path: string, name: string): Observable<EruptApiModel> {
        return this._http.post<EruptApiModel>(FileCenterService.base + '/rename', null, {store, path, name});
    }

    delete(store: string, paths: string[]): Observable<EruptApiModel> {
        return this._http.post<EruptApiModel>(FileCenterService.base + '/delete', paths, {store});
    }

}
