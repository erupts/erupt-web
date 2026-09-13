export interface MenuVo {
    id: number;
    code: string;
    name: string;
    icon: string;
    type: MenuTypeEnum;
    value: string;
    pid: number;
}

// Sidebar / header menu layout mode (settings drawer, persisted in the delon
// layout settings as the splitMenu / dualMenu / topMenu flags).
export enum MenuMode {
    NORMAL = "normal",   // single-column sidebar
    SPLIT = "split",     // first-level tabs in the header, submenu in the sidebar
    DUAL = "dual",       // first-level rail + submenu column inside the sidebar
    TOP = "top",         // whole menu in the header, no sidebar
}

export enum MenuTypeEnum {
    table = "table",
    tree = "tree",
    fill = "fill",
    router = "router",
    button = "button",
    api = "api",
    link = "link",
    microLink = "mlink",
    newWindow = "newWindow",
    selfWindow = "selfWindow",
    bi = "bi",
    tpl = "tpl",
    mtpl = "mtpl",
    cube = "cube",
    form = "form",
    aiCanvas = "aiCanvas",
}
