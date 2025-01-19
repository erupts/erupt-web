export interface MenuVo {
    id: number;
    code: string;
    name: string;
    icon: string;
    type: MenuTypeEnum;
    value: string;
    pid: number;
}

export enum MenuTypeEnum {
    table = "table",
    tree = "tree",
    fill = "fill",
    router = "router",
    button = "button",
    api = "api",
    link = "link",
    newWindow = "newWindow",
    selfWindow = "selfWindow",
    bi = "bi",
    tpl = "tpl",
    mtpl = "mtpl",
}
