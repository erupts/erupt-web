// The header search palette: one list mixing menus, open tabs, recent visits,
// favorites and commands, picked with the mouse or ↑ ↓ Enter.

export enum PaletteGroup {
    TAB = "tab",
    RECENT = "recent",
    FAVORITE = "favorite",
    MENU = "menu",
    COMMAND = "command"
}

// i18n key of each group's heading
export const PALETTE_GROUP_TITLE: Record<PaletteGroup, string> = {
    [PaletteGroup.TAB]: "search.group.tab",
    [PaletteGroup.RECENT]: "menu.recent",
    [PaletteGroup.FAVORITE]: "search.group.favorite",
    [PaletteGroup.MENU]: "search.group.menu",
    [PaletteGroup.COMMAND]: "search.group.command"
};

// A query starting with this lists commands only
export const COMMAND_PREFIX = ">";

/** An action the palette can run, contributed by the header (which owns the actions). */
export interface PaletteCommand {
    key: string;
    label: string;
    icon: string;
    run: () => void;
}

export interface PaletteItem {
    group: PaletteGroup;
    label: string;
    // breadcrumb or route shown dimmed after the label
    hint?: string;
    icon?: string;
    // a css class icon (font-awesome) instead of an ant icon
    iconClass?: string;
    run: () => void;
}

// Queries that led to a pick, newest first, de-duplicated, per browser
export class SearchHistory {

    static readonly KEY = "erupt_search_history";

    static readonly MAX = 8;

    static list(): string[] {
        try {
            const raw = JSON.parse(localStorage.getItem(SearchHistory.KEY) || "[]");
            return Array.isArray(raw) ? raw.filter(q => typeof q === "string" && q) : [];
        } catch {
            return [];
        }
    }

    static push(query: string): void {
        const q = (query || "").trim();
        if (!q) {
            return;
        }
        SearchHistory.save([q, ...SearchHistory.list().filter(i => i !== q)].slice(0, SearchHistory.MAX));
    }

    static remove(query: string): void {
        SearchHistory.save(SearchHistory.list().filter(i => i !== query));
    }

    static clear(): void {
        try {
            localStorage.removeItem(SearchHistory.KEY);
        } catch {
            // storage unavailable: nothing to clear
        }
    }

    private static save(items: string[]): void {
        try {
            localStorage.setItem(SearchHistory.KEY, JSON.stringify(items));
        } catch {
            // storage unavailable: history simply is not kept
        }
    }
}
