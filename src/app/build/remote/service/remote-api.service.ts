import {Inject, Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {_HttpClient} from '@delon/theme';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {Observable} from 'rxjs';
import {RestPath} from '../../erupt/model/erupt.enum';
import {R} from '../../erupt/model/erupt-api.model';
import {SftpEntry, TicketVo} from '../model/remote.model';

@Injectable({providedIn: 'root'})
export class RemoteApiService {

    constructor(private http: _HttpClient,
                private raw: HttpClient,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    /** Issues a one-time session ticket; each WebSocket connection needs a fresh one. */
    ticket(hostId: string): Observable<R<TicketVo>> {
        return this.http.get<R<TicketVo>>(`${RestPath.erupt}/remote/ticket/${hostId}`);
    }

    // ------------------------------------------------------------------ SFTP file panel

    private sftp(hostId: string): string {
        return `${RestPath.erupt}/remote/sftp/${hostId}`;
    }

    sftpHome(hostId: string): Observable<R<string>> {
        return this.http.get<R<string>>(`${this.sftp(hostId)}/home`);
    }

    sftpList(hostId: string, path: string): Observable<R<SftpEntry[]>> {
        return this.http.get<R<SftpEntry[]>>(`${this.sftp(hostId)}/ls`, {path});
    }

    sftpMkdir(hostId: string, path: string, name: string): Observable<R<void>> {
        return this.http.post<R<void>>(`${this.sftp(hostId)}/mkdir`, null, {path, name});
    }

    sftpDelete(hostId: string, path: string): Observable<R<void>> {
        return this.http.delete<R<void>>(this.sftp(hostId), {path});
    }

    /**
     * Streams the file body as-is (no multipart) so the server can pipe it straight into SFTP;
     * progress events are reported for the panel's progress bar.
     */
    sftpUpload(hostId: string, dir: string, file: File): Observable<HttpEvent<R<void>>> {
        return this.raw.post<R<void>>(`${this.sftp(hostId)}/upload`, file, {
            params: new HttpParams({fromObject: {path: dir, name: file.name}}),
            headers: new HttpHeaders({'Content-Type': 'application/octet-stream'}),
            reportProgress: true,
            observe: 'events'
        });
    }

    /** Direct download link; the token travels as a query parameter the way attachment links do. */
    sftpDownloadUrl(hostId: string, path: string): string {
        const token = this.tokenService.get()?.token || '';
        return `${this.sftp(hostId)}/download?path=${encodeURIComponent(path)}&_token=${encodeURIComponent(token)}`;
    }
}
