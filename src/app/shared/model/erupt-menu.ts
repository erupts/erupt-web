import type {Menu} from "@delon/theme";

export interface MenuVo {
    id: number;
    code: string;
    name: string;
    icon: string;
    type: MenuTypeEnum;
    value: string;
    pid: number;
    /** Group of the module declaring a root menu, null for a user's own menu */
    group?: string | null;
}

// The module groups in the order the sidebar and the module center show them (ModuleGroup on the server).
export const MODULE_GROUPS = ['PLATFORM', 'BUSINESS', 'AI', 'DEV_TOOLS', 'OPS', 'DATA'];

// The sidebar's sections, cut from the root menus in their sort order: a run of root menus of one
// module group becomes a titled section; platform menus and menus without a group (the user's own)
// are untitled, except that one sorted inside a group's run stays in that section. Sort remains the
// only order there is: an admin moves a whole section, or a menu into one, by changing sort.
export function menuSections(tree: Menu[], groupOf: (key: string) => string | null | undefined,
                             title: (group: string) => string): Menu[] {
    // the titled kind of each root menu, null for the untitled ones
    const kinds = tree.map(item => {
        const group = groupOf(item.key!);
        return group && group !== 'PLATFORM' ? group : null;
    });
    const sections: Menu[] = [];
    let current: Menu | null = null;
    let currentKind: string | null = null;
    tree.forEach((item, i) => {
        let kind = kinds[i];
        if (kind === null && currentKind !== null) {
            // an untitled menu between two menus of the current group belongs to the group's section
            const next = kinds.slice(i + 1).find(k => k !== null);
            if (next === currentKind) kind = currentKind;
        }
        if (!current || kind !== currentKind) {
            current = kind
                ? {group: true, hideInBreadcrumb: true, text: title(kind), children: []}
                : {group: false, hideInBreadcrumb: true, text: '~', children: []};
            currentKind = kind;
            sections.push(current);
        }
        current.children!.push(item);
    });
    return sections;
}

// Sidebar / header menu layout mode (settings drawer, persisted in the delon
// layout settings as one boolean flag per non-normal mode, see MENU_MODE_FLAGS).
export enum MenuMode {
    NORMAL = "normal",   // single-column sidebar
    SPLIT = "split",     // first-level tabs in the header, submenu in the sidebar
    DUAL = "dual",       // first-level rail + submenu column inside the sidebar
    TOP = "top",         // whole menu in the header, no sidebar
    GROUP = "group",     // first-level items as flat group titles, children listed underneath
    TOP_SPLIT = "top-split", // first-level tabs in the header, second level in a sub-nav row below it, no sidebar
}

// Layout flag that marks each mode as active (NORMAL = every flag off).
export const MENU_MODE_FLAGS: Record<Exclude<MenuMode, MenuMode.NORMAL>, string> = {
    [MenuMode.SPLIT]: "splitMenu",
    [MenuMode.DUAL]: "dualMenu",
    [MenuMode.TOP]: "topMenu",
    [MenuMode.GROUP]: "groupMenu",
    [MenuMode.TOP_SPLIT]: "topSplitMenu",
};

// Modes that render the menu in the header and therefore take the breadcrumb's place.
export function isHeaderMenuMode(mode: MenuMode): boolean {
    return mode === MenuMode.SPLIT || mode === MenuMode.TOP || mode === MenuMode.TOP_SPLIT;
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

// First-level menu items (children of delon's root groups), hidden ones dropped.
export function topLevelMenus(menus: Menu[]): Menu[] {
    return menus.flatMap(g => (g.children || []).filter(i => !i['_hidden']));
}

// Category the split / dual / top-split modes are showing: the persisted
// splitMenuKey, else the first one.
export function selectedTopMenu(topItems: Menu[], layout: Record<string, any>): Menu | null {
    const key = layout['splitMenuKey'];
    return topItems.find(i => key && (i.key === key || i.text === key)) ?? topItems[0] ?? null;
}
