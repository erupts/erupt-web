/**
 * 根据菜单类型生成相应的请求路径
 * @param menuType  菜单类型
 * @param menuValue 菜单值
 */
import {MenuTypeEnum, MenuVo} from "@shared/model/erupt-menu";

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
