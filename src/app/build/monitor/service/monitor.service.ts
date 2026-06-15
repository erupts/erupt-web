import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {downloadFile} from '@shared/util/erupt.util';
import {RestPath} from '../../erupt/model/erupt.enum';
import {DataSourcePool, JvmDiagnosis, Platform, RedisInfo, Server} from '../model/monitor.model';

@Injectable()
export class MonitorService {

    static readonly path = RestPath.erupt + '/erupt-monitor';

    constructor(private _http: _HttpClient) {
    }

    serverInfo(waitCpu: boolean): Observable<Server> {
        return this._http.get<Server>(MonitorService.path + '/server/info', {waitCpu});
    }

    platform(): Observable<Platform> {
        return this._http.get<Platform>(MonitorService.path + '/server/platform');
    }

    redisInfo(): Observable<RedisInfo> {
        return this._http.get<RedisInfo>(MonitorService.path + '/redis/info');
    }

    jvmDiagnosis(): Observable<JvmDiagnosis> {
        return this._http.get<JvmDiagnosis>(MonitorService.path + '/diagnosis/jvm');
    }

    datasource(): Observable<DataSourcePool[]> {
        return this._http.get<DataSourcePool[]>(MonitorService.path + '/diagnosis/datasource');
    }

    threadDump(callback?: Function): void {
        this._http.get(MonitorService.path + '/diagnosis/thread-dump', null, {
            responseType: 'arraybuffer',
            observe: 'events'
        }).subscribe({
            next: (res: any) => {
                if (res.type === 4) {
                    downloadFile(res);
                    callback && callback();
                }
            },
            error: () => callback && callback()
        });
    }
}
