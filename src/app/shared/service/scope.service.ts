import {Injectable, NgZone} from "@angular/core";
import {Router} from "@angular/router";
import {_HttpClient} from "@delon/theme";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {Observable, Subject, tap} from "rxjs";
import {RestPath} from "../../build/erupt/model/erupt.enum";

/** A signed scope pick, as the server returns it */
export interface ScopeAccepted {
    token: string;
    values: { [field: string]: any };
    labels: { [field: string]: string };
    // epoch seconds
    expireAt: number;
}

/** A scope offered in the header */
export interface ScopeView {
    // simple class name of the scope form
    name: string;
    title: string;
    // a model on the user's menus that declares the scope; its form loads under this parent
    parent: string;
    // models that declare the scope: the header offers it on their pages only
    models: string[];
    fields: string[];
    defaults?: ScopeAccepted;
}

/**
 * The picks every request carries. A plain holder with no injection, so the HTTP interceptor can
 * read it without depending on a service that itself needs HttpClient.
 */
export class ScopeStore {

    static readonly HEADER = "erupt-scope";

    static picks: { [scope: string]: ScopeAccepted } = {};

    static header(): string {
        const now = Date.now() / 1000;
        return Object.values(ScopeStore.picks).filter(p => p && p.expireAt > now).map(p => p.token).join(",");
    }

    static value(scope: string, field: string): any {
        const pick = ScopeStore.picks[scope];
        return pick ? pick.values[field] : null;
    }

}

// Renew a pick this long before it expires, so a page left open keeps its scope
const RENEW_BEFORE_SECONDS = 300;

@Injectable({providedIn: "root"})
export class ScopeService {

    scopes: ScopeView[] = [];

    readonly change = new Subject<void>();

    private storageKey: string;

    private renewTimer: any;

    constructor(private http: _HttpClient, private router: Router, private reuseTab: ReuseTabService, private zone: NgZone) {
        // Another window of the same user switched: follow it, so no open tab acts on the old scope
        window.addEventListener("storage", e => {
            if (this.storageKey && e.key === this.storageKey) {
                this.zone.run(() => {
                    this.restore();
                    this.change.next();
                    this.refreshTabs();
                });
            }
        });
    }

    load(account: string): void {
        this.storageKey = "erupt.scope:" + account;
        this.http.get<ScopeView[]>(RestPath.erupt + "/scope").subscribe(scopes => {
            this.scopes = scopes || [];
            this.restore();
            this.change.next();
            clearInterval(this.renewTimer);
            this.renewTimer = setInterval(() => this.renew(), 60 * 1000);
        });
    }

    current(scope: string): ScopeAccepted {
        return ScopeStore.picks[scope];
    }

    // "orbstack / demo": the labels of the picked values, in form order
    summary(scope: string): string {
        const pick = ScopeStore.picks[scope];
        const view = this.scopes.find(s => s.name === scope);
        if (!pick || !view) return "";
        return view.fields.map(f => pick.labels[f]).filter(l => !!l).join(" / ");
    }

    pick(scope: string, values: object): Observable<ScopeAccepted> {
        return this.http.post<ScopeAccepted>(RestPath.erupt + "/scope/" + scope, values).pipe(tap(accepted => {
            ScopeStore.picks[scope] = accepted;
            this.save();
            this.change.next();
            this.refreshTabs();
        }));
    }

    /**
     * Rebuilds every open tab under the new scope: a tab still showing the old one could act on it.
     */
    refreshTabs(): void {
        const url = this.router.url;
        this.reuseTab.clear(true);
        this.router.navigateByUrl("/", {skipLocationChange: true}).then(() => this.router.navigateByUrl(url));
    }

    // Stored picks that are still valid, else the server's defaults
    private restore(): void {
        let stored: { [scope: string]: ScopeAccepted } = {};
        try {
            stored = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
        } catch (e) {
            stored = {};
        }
        const now = Date.now() / 1000;
        ScopeStore.picks = {};
        for (const view of this.scopes) {
            const pick = stored[view.name];
            const picked = pick && pick.expireAt > now ? pick : view.defaults;
            if (picked) ScopeStore.picks[view.name] = picked;
        }
    }

    private save(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(ScopeStore.picks));
        } catch (e) {
            // storage unavailable: the pick still holds for this window
        }
    }

    private renew(): void {
        const soon = Date.now() / 1000 + RENEW_BEFORE_SECONDS;
        for (const [scope, pick] of Object.entries(ScopeStore.picks)) {
            if (pick && pick.expireAt < soon) {
                this.http.post<ScopeAccepted>(RestPath.erupt + "/scope/" + scope, pick.values).subscribe(accepted => {
                    ScopeStore.picks[scope] = accepted;
                    this.save();
                });
            }
        }
    }

}
