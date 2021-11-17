/**
 * 根据菜单类型生成相应的请求路径
 * @param menuType  菜单类型
 * @param menuValue 菜单值
 */
import {MenuTypeEnum} from "@shared/model/erupt-menu";
import {HttpEvent} from "@angular/common/http";

export function generateMenuPath(type: string, value: string) {
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
            return "/" + menuValue;
        case MenuTypeEnum.newWindow:
            return "/" + menuValue;
        case MenuTypeEnum.link:
            return "/site/" + encodeURIComponent(window.btoa(menuValue));
        case MenuTypeEnum.fill:
            if (menuValue.startsWith("/")) {
                return "/fill" + menuValue;
            } else {
                return "/fill/" + menuValue;
            }
    }
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
