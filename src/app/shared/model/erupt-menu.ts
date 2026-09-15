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
// layout settings as one boolean flag per non-normal mode, see MENU_MODE_FLAGS).
export enum MenuMode {
    NORMAL = "normal",   // single-column sidebar
    SPLIT = "split",     // first-level tabs in the header, submenu in the sidebar
    DUAL = "dual",       // first-level rail + submenu column inside the sidebar
    TOP = "top",         // whole menu in the header, no sidebar
    GROUP = "group",     // first-level items as flat group titles, children listed underneath
}

// Layout flag that marks each mode as active (NORMAL = every flag off).
export const MENU_MODE_FLAGS: Record<Exclude<MenuMode, MenuMode.NORMAL>, string> = {
    [MenuMode.SPLIT]: "splitMenu",
    [MenuMode.DUAL]: "dualMenu",
    [MenuMode.TOP]: "topMenu",
    [MenuMode.GROUP]: "groupMenu",
};

// Modes that render the menu in the header and therefore take the breadcrumb's place.
export function isHeaderMenuMode(mode: MenuMode): boolean {
    return mode === MenuMode.SPLIT || mode === MenuMode.TOP;
}

// Read the active mode back from the layout flags.
export function menuModeOf(layout: Record<string, any>): MenuMode {
    for (const [mode, flag] of Object.entries(MENU_MODE_FLAGS)) {
        if (layout[flag]) return mode as MenuMode;
    }
    return MenuMode.NORMAL;
}

// True once the user has picked a mode (any flag persisted, even as false).
export function hasMenuModeChoice(layout: Record<string, any>): boolean {
    return Object.values(MENU_MODE_FLAGS).some(flag => flag in layout);
}

// Flag values for a mode: exactly the chosen one is true.
export function menuModeFlags(mode: MenuMode): Record<string, boolean> {
    const flags: Record<string, boolean> = {};
    for (const [m, flag] of Object.entries(MENU_MODE_FLAGS)) {
        flags[flag] = m === mode;
    }
    return flags;
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
