import {Injectable} from '@angular/core';
import {MenuVo} from "@shared/model/erupt-menu";


@Injectable({
    providedIn: 'root'
})
export class EruptMenuService {

    constructor() {
    }

    codeMenuItem: Map<String, MenuVo> = new Map<String, MenuVo>();

    putMenus(menus: MenuVo[]) {
        for (let menu of menus) {
            this.codeMenuItem.set(menu.code, menu);
        }
    }

    getMenuValue(code): string {
        return this.getMenu(code).value;
    }

    getMenu(code): MenuVo {
        return this.codeMenuItem.get(code);
    }

    removeMenus() {
        this.codeMenuItem = new Map<String, MenuVo>();
    }

}
