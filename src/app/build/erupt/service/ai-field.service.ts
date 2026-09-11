import {Inject, Injectable} from '@angular/core';
import {DA_SERVICE_TOKEN, ITokenService} from '@delon/auth';
import {RestPath} from '../model/erupt.enum';
import {SseMessageEvent} from '../../ai/model/chat.model';

/** What the assistant should do to the field; mirrors AiFieldRequest.Action on the backend */
export enum AiFieldAction {
    /** Draft the field from scratch, using the rest of the form as the brief */
    GENERATE = 'GENERATE',
    /** Rewrite what is already there, keeping the meaning */
    POLISH = 'POLISH',
    /** Carry on from where the text stops */
    CONTINUE = 'CONTINUE',
    /** Say the same thing in fewer words */
    SHORTEN = 'SHORTEN',
    /** Say the same thing in more detail */
    EXPAND = 'EXPAND',
    /** Follow the user's own instruction verbatim */
    CUSTOM = 'CUSTOM'
}

export interface AiFieldRequest {
    action: AiFieldAction;
    instruction?: string;
    current?: string;
    selection?: string;
    /** Sibling field values on the same form, keyed by field name */
    form?: { [key: string]: any };
}

/**
 * Streams a drafted field value from the backend. EventSource is not an option here — the
 * request carries the whole form as its body — so the SSE frames are read off a POST via fetch.
 */
@Injectable({providedIn: 'root'})
export class AiFieldService {

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    /**
     * @param onToken called with each streamed chunk, in order
     * @return a promise resolving when the stream is done; aborting the signal resolves it too
     */
    async generate(eruptName: string, fieldName: string, parentEruptName: string | null,
                   body: AiFieldRequest, onToken: (text: string) => void,
                   signal: AbortSignal): Promise<void> {
        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
            'token': this.tokenService.get()?.token || '',
            'erupt': eruptName
        };
        if (parentEruptName) headers['eruptParent'] = parentEruptName;

        const response = await fetch(
            `${RestPath.erupt}/ai/field/${encodeURIComponent(eruptName)}/${encodeURIComponent(fieldName)}`,
            {method: 'POST', headers, body: JSON.stringify(body), signal}
        );
        if (!response.ok || !response.body) {
            throw new Error(`AI request failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, {stream: true});
            // SSE frames are separated by a blank line; a partial tail stays in the buffer
            let split: number;
            while ((split = buffer.indexOf('\n\n')) >= 0) {
                const frame = buffer.slice(0, split);
                buffer = buffer.slice(split + 2);
                const payload = frame.split('\n')
                    .filter(line => line.startsWith('data:'))
                    .map(line => line.slice(5).trim())
                    .join('');
                if (!payload) continue;
                let message: { event: SseMessageEvent, data: string };
                try {
                    message = JSON.parse(payload);
                } catch {
                    continue;
                }
                if (message.event === SseMessageEvent.DONE) return;
                if (message.event === SseMessageEvent.TOKEN && message.data) onToken(message.data);
            }
        }
    }

}
