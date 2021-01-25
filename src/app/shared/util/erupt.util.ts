import {MenuTypeEnum} from "../../build/erupt/model/erupt.vo";

/**
 * 根据菜单类型生成相应的请求路径
 * @param menuType  菜单类型
 * @param menuValue 菜单值
 */
export function generateMenuPath(menuType: string, menuValue: string) {
    switch (menuType) {
        case MenuTypeEnum.table:
            return "/build/table/" + menuValue;
        case MenuTypeEnum.tree:
            return "/build/tree/" + menuValue;
        case MenuTypeEnum.fill:
            if (menuValue.startsWith("/")) {
                return "/fill" + menuValue;
            } else {
                return "/fill/" + menuValue;
            }
        case MenuTypeEnum.router:
            return "/" + menuValue;
        case MenuTypeEnum.newWindow:
            return "/";
        case MenuTypeEnum.link:
            return "/site/" + window.btoa(encodeURIComponent(menuValue))
        case MenuTypeEnum.bi:
            return "/bi/" + menuValue;
        case MenuTypeEnum.tpl:
            return "/tpl/" + menuValue;
    }
}
