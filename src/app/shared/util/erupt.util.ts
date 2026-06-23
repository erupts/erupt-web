/**
 * Generate the corresponding request path based on menu type
 * @param menuType  menu type
 * @param menuValue menu value
 */
import {HttpEvent} from "@angular/common/http";
import {MenuTypeEnum} from "../model/erupt-menu";

export function generateMenuPath(type: string, value: string) {
    let menuValue = value || '';
    if (menuValue.indexOf("fill=1") != -1 || menuValue.indexOf("fill=true") != -1) {
        return '/fill' + joinPath(type, value);
    } else {
        return joinPath(type, value);
    }
}

//associated path
function joinPath(type: string, value: string): string {
    let menuValue = value || '';
    switch (type) {
        case MenuTypeEnum.table:
            return "/build/table/" + menuValue;
        case MenuTypeEnum.tree:
            return "/build/tree/" + menuValue;
        case MenuTypeEnum.form:
            return "/build/form/" + menuValue;
        case MenuTypeEnum.bi:
            return "/bi/" + menuValue;
        case MenuTypeEnum.cube:
            return "/cube/" + menuValue;
        case MenuTypeEnum.tpl:
            return "/tpl/" + menuValue;
        case MenuTypeEnum.mtpl:
            return "/mtpl/" + menuValue;
        case MenuTypeEnum.router:
            return menuValue;
        case MenuTypeEnum.newWindow:
            return "/" + menuValue;
        case MenuTypeEnum.selfWindow:
            return "/" + menuValue;
        case MenuTypeEnum.link:
            return "/site/" + encodeURIComponent(window.btoa(encodeURIComponent(menuValue)));
        case MenuTypeEnum.fill:
            if (menuValue.startsWith("/")) {
                return "/fill" + menuValue;
            } else {
                return "/fill/" + menuValue;
            }
    }
    return null;
}


export function downloadFile(res: HttpEvent<any>): boolean {
    // @ts-ignore
    const disposition: string = res.headers?.get('Content-Disposition');
    if (!disposition) return false;
    // @ts-ignore
    const filename = disposition.split(';')[1]?.split('=')?.[1];
    if (!filename) return false;
    // @ts-ignore
    let url = window.URL.createObjectURL(new Blob([res.body]));
    let link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.setAttribute("download", decodeURIComponent(filename));
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
}


export function isNull(val: any): boolean {
    return !val && val != 0;
}

export function isNotNull(val: any) {
    return !isNull(val);
}

export function spliceArr(arr: any[], length: number): any[][] {
    const res: any[][] = [];
    while (arr.length > 0) {
        const chunk: any[] = arr.splice(0, length);
        res.push(chunk);
    }
    return res;
}
