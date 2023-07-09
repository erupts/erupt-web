import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";


@Injectable({providedIn: 'root'})
export class AppViewService {

    //路由的视图值
    public routerViewDescSubject = new Subject<string>();

    constructor() {
    }

    //设置路由描述
    setRouterViewDesc(desc: string) {
        this.routerViewDescSubject.next(desc);
    }


}
