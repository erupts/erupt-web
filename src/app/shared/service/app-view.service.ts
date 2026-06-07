import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";


@Injectable({providedIn: 'root'})
export class AppViewService {

    //router view value
    public routerViewDescSubject = new Subject<string>();

    constructor() {
    }

    //set router description
    setRouterViewDesc(desc: string) {
        this.routerViewDescSubject.next(desc);
    }


}
