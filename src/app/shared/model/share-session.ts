/**
 * The session a visitor got from a public share link. It lives in sessionStorage, apart from the
 * admin's login token: opening a link in a tab where someone is logged in must not log them out,
 * and the link's narrow session must never serve the admin pages. The share routes read this
 * token, every other route keeps using the login token.
 */
export class ShareSession {

    private static readonly KEY = "erupt-share-session";

    static readonly ROUTE = "/share/";

    // Whether the page shown now belongs to a share link
    static active(): boolean {
        const hash = location.hash || "";
        return hash.startsWith("#" + ShareSession.ROUTE) || location.pathname.startsWith(ShareSession.ROUTE);
    }

    static set(code: string, token: string): void {
        try {
            sessionStorage.setItem(ShareSession.KEY, JSON.stringify({code, token}));
        } catch (e) {
            console.error(e);
        }
    }

    static token(): string | null {
        try {
            const raw = sessionStorage.getItem(ShareSession.KEY);
            return raw ? JSON.parse(raw).token || null : null;
        } catch (e) {
            return null;
        }
    }

    static clear(): void {
        try {
            sessionStorage.removeItem(ShareSession.KEY);
        } catch (e) {
            // nothing to clear
        }
    }
}
