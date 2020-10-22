export interface MenuVo {
    id: number;
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
    link = "link",
    newWindow = "newWindow",
    bi = "bi",
    tpl = "tpl"
}
