import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {R} from '@shared/model/api.model';
import {RestPath} from '../../erupt/model/erupt.enum';

export interface CanvasVersion {
    id: number;
    version: number;
    message: string;
    dataType: string;
    targetModel: string;
    style: string | null;
    createTime: string;
}

export interface CanvasInfo {
    name: string;
    dataType: string | null;
    targetModel: string | null;
    style: string | null;
    activeVersion: number | null;
    versions: CanvasVersion[];
}

export interface ModelGroup {
    type: string;
    models: { value: string; label: string }[];
}

export interface CanvasStyle {
    id: string;
    name: string;
    description: string;
    mode: string | null;
    palette: string[] | null;
}

@Injectable()
export class CanvasApiService {

    private base = RestPath.erupt + '/ai-canvas/build';

    constructor(private _http: _HttpClient) {
    }

    info(canvasId: number): Observable<R<CanvasInfo>> {
        return this._http.get<R<CanvasInfo>>(`${this.base}/${canvasId}`);
    }

    models(): Observable<R<ModelGroup[]>> {
        return this._http.get<R<ModelGroup[]>>(`${this.base}/models`);
    }

    styles(): Observable<R<CanvasStyle[]>> {
        return this._http.get<R<CanvasStyle[]>>(`${this.base}/styles`);
    }

    generate(canvasId: number, message: string, dataType: string, targetModel: string, style: string | null): Observable<R<CanvasVersion>> {
        return this._http.post<R<CanvasVersion>>(`${this.base}/generate/${canvasId}`, {message, dataType, targetModel, style});
    }

    /** SSE URL of the streaming generate endpoint (EventSource is GET-only, token travels as _token) */
    generateSseUrl(canvasId: number, message: string, dataType: string, targetModel: string, style: string | null, token: string): string {
        const params = new URLSearchParams({message, dataType, targetModel, _token: token});
        if (style) params.set('style', style);
        return `${this.base}/generate-sse/${canvasId}?${params.toString()}`;
    }

    active(canvasId: number, versionId: number): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/active/${canvasId}/${versionId}`);
    }

    /** Signal the backend to discard the running generation round */
    stop(canvasId: number): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/stop/${canvasId}`);
    }

}
