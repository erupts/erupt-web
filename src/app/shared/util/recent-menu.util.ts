// Recently opened menus — a per-browser list the layout appends to on every
// navigation that lands on a menu item, and the welcome page (src/home.html)
// reads back from the same localStorage key to offer "return to" shortcuts.
// Newest first, de-duplicated by link, capped so the list stays scannable.

export interface RecentMenu {
    link: string;
    text: string;
    at: number; // epoch millis of the last visit
    count?: number; // visits so far (absent on entries written before counting existed)
}

export class RecentMenus {

    static readonly KEY = "erupt_menu_recent";

    static readonly MAX = 20;

    static list(): RecentMenu[] {
        try {
            const raw = JSON.parse(localStorage.getItem(RecentMenus.KEY) || "[]");
            return Array.isArray(raw) ? raw.filter(i => i && i.link) : [];
        } catch {
            return [];
        }
    }

    static push(link: string, text: string): void {
        if (!link || link === "/") {
            return;
        }
        const all = RecentMenus.list();
        const prev = all.find(i => i.link === link);
        const rest = all.filter(i => i.link !== link);
        rest.unshift({link, text, at: Date.now(), count: (prev?.count || 1) + (prev ? 1 : 0)});
        RecentMenus.save(rest.slice(0, RecentMenus.MAX));
    }

    static remove(link: string): void {
        RecentMenus.save(RecentMenus.list().filter(i => i.link !== link));
    }

    private static save(items: RecentMenu[]): void {
        localStorage.setItem(RecentMenus.KEY, JSON.stringify(items));
    }
}
