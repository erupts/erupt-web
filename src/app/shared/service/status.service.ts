import {Injectable} from '@angular/core';
import {MenuVo} from "@shared/model/erupt-menu";

@Injectable({
    providedIn: 'root'
})
export class StatusService {

    isFillLayout: boolean = false;

    menus: MenuVo[] = [];

    constructor() {
    }

}
