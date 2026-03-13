import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {R, SimplePage} from '@shared/model/api.model';
import {RestPath} from '../../erupt/model/erupt.enum';
import {Agent, Chat, ChatMessage, UserInfo} from '../model/chat.model';

@Injectable()
export class ChatApiService {

    constructor(private _http: _HttpClient) {
    }

    userInfo(): Observable<UserInfo> {
        return this._http.get<UserInfo>(RestPath.erupt + '/userinfo');
    }

    chats(page: number, size: number): Observable<R<SimplePage<Chat>>> {
        return this._http.get<R<SimplePage<Chat>>>(RestPath.erupt + '/ai/chat/chats', {page, size});
    }

    agents(): Observable<R<Agent[]>> {
        return this._http.get<R<Agent[]>>(RestPath.erupt + '/ai/agent/list');
    }

    createChat(title: string): Observable<R<number>> {
        return this._http.post<R<number>>(RestPath.erupt + '/ai/chat/create-chat?title=' + title);
    }

    deleteChat(chatId: number): Observable<R<void>> {
        return this._http.get<R<void>>(RestPath.erupt + '/ai/chat/delete-chat', {chatId});
    }

    renameChat(chatId: number, title: string): Observable<R<void>> {
        return this._http.post<R<void>>(RestPath.erupt + '/ai/chat/rename-chat', null, {chatId, title});
    }

    messages(chatId: number, size: number, index: number): Observable<R<ChatMessage[]>> {
        return this._http.get<R<ChatMessage[]>>(RestPath.erupt + '/ai/chat/messages', {
            chatId,
            size,
            index
        });
    }
}
