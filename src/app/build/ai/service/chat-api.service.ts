import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {R, SimplePage} from '@shared/model/api.model';
import {RestPath} from '../../erupt/model/erupt.enum';
import {Agent, Chat, ChatMessage, Llm, UserInfo} from '../model/chat.model';

@Injectable()
export class ChatApiService {

    constructor(private _http: _HttpClient) {
    }

    userInfo(): Observable<UserInfo> {
        return this._http.get<UserInfo>(RestPath.erupt + '/userinfo');
    }

    chats(index: number, size: number): Observable<R<SimplePage<Chat>>> {
        return this._http.get<R<SimplePage<Chat>>>(RestPath.erupt + '/ai/chat/chats', {index, size});
    }

    agents(): Observable<R<Agent[]>> {
        return this._http.get<R<Agent[]>>(RestPath.erupt + '/ai/agent/list');
    }

    llms(): Observable<R<Llm[]>> {
        return this._http.get<R<Llm[]>>(RestPath.erupt + '/ai/chat/llms');
    }

    createChat(title: string): Observable<R<number>> {
        return this._http.post<R<number>>(RestPath.erupt + '/ai/chat/create-chat?title=' + title);
    }

    stopChat(chatId: number): Observable<R<void>> {
        return this._http.get<R<void>>(RestPath.erupt + '/ai/chat/stop', {chatId});
    }

    deleteChat(chatId: number): Observable<R<void>> {
        return this._http.get<R<void>>(RestPath.erupt + '/ai/chat/delete-chat', {chatId});
    }

    renameChat(chatId: number, title: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + '/ai/chat/rename-chat', null, {chatId, title});
    }

    uploadImage(file: File): Observable<R<string>> {
        const form = new FormData();
        form.append('file', file);
        return this._http.post<R<string>>(RestPath.erupt + '/ai/chat/upload-image', form);
    }

    messages(chatId: number, size: number, index: number): Observable<R<ChatMessage[]>> {
        return this._http.get<R<ChatMessage[]>>(RestPath.erupt + '/ai/chat/messages', {
            chatId,
            size,
            index
        });
    }
}
