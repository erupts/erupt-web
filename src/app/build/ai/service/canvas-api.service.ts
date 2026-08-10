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
    llmId: number | null;
    activeVersion: number | null;
    versions: CanvasVersion[];
}

export interface ModelGroup {
    type: string;
    models: { value: string; label: string }[];
}

export interface Llm {
    id: number;
    name: string;
    defaultLLM: boolean;
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

    info(code: string): Observable<R<CanvasInfo>> {
        return this._http.get<R<CanvasInfo>>(`${this.base}/${code}`);
    }

    /** Processed page source of the active version, embedded via iframe srcdoc */
    html(code: string): Observable<string> {
        return this._http.get(`${RestPath.erupt}/ai-canvas/html/${code}`, null, {responseType: 'text'});
    }

    models(): Observable<R<ModelGroup[]>> {
        return this._http.get<R<ModelGroup[]>>(`${this.base}/models`);
    }

    styles(): Observable<R<CanvasStyle[]>> {
        return this._http.get<R<CanvasStyle[]>>(`${this.base}/styles`);
    }

    llms(): Observable<R<Llm[]>> {
        return this._http.get<R<Llm[]>>(`${this.base}/llms`);
    }

    generate(code: string, message: string, dataType: string, targetModel: string, style: string | null, llmId: number | null,
             element: string | null): Observable<R<CanvasVersion>> {
        return this._http.post<R<CanvasVersion>>(`${this.base}/generate/${code}`, {message, dataType, targetModel, style, llmId, element});
    }

    /** SSE URL of the streaming generate endpoint (EventSource is GET-only, token travels as _token) */
    generateSseUrl(code: string, message: string, dataType: string, targetModel: string, style: string | null, llmId: number | null, token: string,
                   element: string | null): string {
        const params = new URLSearchParams({message, dataType, targetModel, _token: token});
        if (style) params.set('style', style);
        if (llmId != null) params.set('llmId', String(llmId));
        // Only the picked element's selector travels here — the backend already holds the
        // full page source, so it resolves the element there without shipping its markup
        if (element) params.set('element', element);
        return `${this.base}/generate-sse/${code}?${params.toString()}`;
    }

    active(code: string, versionId: number): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/active/${code}/${versionId}`);
    }

    /** Signal the backend to discard the running generation round */
    stop(code: string): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/stop/${code}`);
    }

}
