import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {RestPath} from '../../erupt/model/erupt.enum';
import {R} from '../../erupt/model/erupt-api.model';
import {TicketVo} from '../model/remote.model';

@Injectable({providedIn: 'root'})
export class RemoteApiService {

    constructor(private http: _HttpClient) {
    }

    /** Issues a one-time session ticket; each WebSocket connection needs a fresh one. */
    ticket(hostId: string): Observable<R<TicketVo>> {
        return this.http.get<R<TicketVo>>(`${RestPath.erupt}/remote/ticket/${hostId}`);
    }
}
