import {Injectable} from '@angular/core';
import {MenuVo} from "@shared/model/erupt-menu";

@Injectable({
    providedIn: 'root'
})
export class StatusService {

    isFillLayout: boolean = false;

    /** Raw menu list of the current user, as returned by the backend (includes hidden button/api menus). */
    menus: MenuVo[] = [];

    /** True while a route (lazy module) is loading; set by the erupt layout from router events. */
    routeLoading: boolean = false;

    /** Link of the sidebar menu item whose click started the current navigation, for the inline spinner. */
    pendingMenuLink: string | null = null;

    constructor() {
    }

    /**
     * Whether the current user holds a menu whose `value` equals the given permission value,
     * e.g. `Dept@ADD`. Mirrors the backend lookup (`EruptTokenService` → MENU_VALUE_MAP):
     * case-insensitive, query string after "?" ignored.
     */
    hasMenuValue(value: string): boolean {
        if (!value) return false;
        const target = value.toLowerCase();
        return this.menus.some(m => m.value && m.value.toLowerCase().split('?')[0] === target);
    }

}
