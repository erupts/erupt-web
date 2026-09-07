import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {R} from '@shared/model/api.model';
import {RestPath} from '../../erupt/model/erupt.enum';

export interface CanvasVersion {
    id: number;
    version: number;
    message: string;
    style: string | null;
    createTime: string;
}

/** One data model bound to the canvas, configured as a MULTI_FORM block on the record */
export interface CanvasModel {
    dataType: string;
    model: string;
    purpose: string | null;
    /** Write operations the page may offer on this model (add / update / delete); empty = read-only */
    writes: string[];
}

/**
 * The running-round marker the backend keeps for a canvas. Alive while a round runs;
 * gone once a version is filed; carries `error` when the round failed (reported once).
 */
export interface CanvasGenerating {
    startedAt: number;
    message: string;
    error?: string | null;
}

export interface CanvasInfo {
    name: string;
    models: CanvasModel[];
    style: string | null;
    llmId: number | null;
    activeVersion: number | null;
    publishVersion: number | null;
    versions: CanvasVersion[];
    /** Non-null when a round was already running when the designer was opened */
    generating: CanvasGenerating | null;
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

    /** Polled while a round is in flight; resolves to null once it is done or gone */
    generating(code: string): Observable<R<CanvasGenerating | null>> {
        return this._http.get(`${this.base}/generating/${code}`);
    }

    info(code: string): Observable<R<CanvasInfo>> {
        return this._http.get<R<CanvasInfo>>(`${this.base}/${code}`);
    }

    /** Published page source served to viewers */
    html(code: string): Observable<string> {
        return this._http.get(`${RestPath.erupt}/ai-canvas/html/${code}`, null, {responseType: 'text'});
    }

    /** Working-draft page source (active version) for the designer preview iframe */
    preview(code: string): Observable<string> {
        return this._http.get(`${this.base}/preview/${code}`, null, {responseType: 'text'});
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

    /**
     * Start a generation round; returns as soon as the round is opened. Progress and
     * outcome are then read through `generating()`, the same poll used after a reload.
     * Only the picked element's selector travels — the backend holds the page source.
     */
    generate(code: string, message: string, style: string | null, llmId: number | null,
             element: string | null): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/generate/${code}`, {message, style, llmId, element});
    }

    active(code: string, versionId: number): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/active/${code}/${versionId}`);
    }

    /** Publish the working draft so viewers pick it up */
    publish(code: string): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/publish/${code}`);
    }

    /** Signal the backend to discard the running generation round */
    stop(code: string): Observable<R<void>> {
        return this._http.post<R<void>>(`${this.base}/stop/${code}`);
    }

}
