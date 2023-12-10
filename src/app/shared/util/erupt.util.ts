/**
 * 根据菜单类型生成相应的请求路径
 * @param menuType  菜单类型
 * @param menuValue 菜单值
 */
import {HttpEvent} from "@angular/common/http";
import {MenuTypeEnum} from "../model/erupt-menu";

export function generateMenuPath(type: string, value: string) {
    let menuValue = value || '';
    if (menuValue.indexOf("fill=true") != -1) {
        return '/fill' + joinPath(type, value);
    } else {
        return joinPath(type, value);
    }
}

//关联路径
function joinPath(type: string, value: string): string {
    let menuValue = value || '';
    switch (type) {
        case MenuTypeEnum.table:
            return "/build/table/" + menuValue;
        case MenuTypeEnum.tree:
            return "/build/tree/" + menuValue;
        case MenuTypeEnum.bi:
            return "/bi/" + menuValue;
        case MenuTypeEnum.tpl:
            return "/tpl/" + menuValue;
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


export function downloadFile(res: HttpEvent<any>) {
    // @ts-ignore
    let url = window.URL.createObjectURL(new Blob([res.body]));
    let link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    // @ts-ignore
    link.setAttribute("download", decodeURIComponent(res.headers.get('Content-Disposition').split(';')[1].split('=')[1]));
    document.body.appendChild(link);
    link.click();
    link.remove();
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
