import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {_HttpClient} from "@delon/theme";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {forkJoin, Observable, of, ReplaySubject, take, tap} from "rxjs";
import {catchError} from "rxjs/operators";
import {RestPath} from "../../build/erupt/model/erupt.enum";
import {ShareSession} from "@shared/model/share-session";
import {Userinfo} from "@shared/model/user.model";

/** A scope pick the server accepted, with the labels of its values */
export interface ScopeAccepted {
    values: { [field: string]: any };
    labels: { [field: string]: string };
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
    // the form's addBehavior values; absent when they leave a required field empty, and the
    // page then asks the user to pick
    defaults?: ScopeAccepted;
}

/**
 * The picks this window's requests carry. Each window keeps its own, so a page and the requests it
 * sends always agree on the scope. A plain holder with no injection, so the HTTP interceptor can read
 * it without depending on a service that itself needs HttpClient.
 */
export class ScopeStore {

    static readonly HEADER = "erupt-scope";

    static picks: { [scope: string]: ScopeAccepted } = {};

    // {"KubeScope":{"cluster":"orbstack"}}, URL-encoded; the server checks it on every request
    static header(): string {
        const picks = Object.entries(ScopeStore.picks);
        return picks.length ? encodeURIComponent(JSON.stringify(Object.fromEntries(picks.map(([k, p]) => [k, p.values])))) : "";
    }

    static value(scope: string, field: string): any {
        const pick = ScopeStore.picks[scope];
        return pick ? pick.values[field] : null;
    }

}

@Injectable({providedIn: "root"})
export class ScopeService {

    scopes: ScopeView[] = [];

    // the scopes and this window's picks have arrived; a scoped page waits for them
    private loaded$ = new ReplaySubject<void>(1);

    // the last pick of each scope, shared by the user's windows and kept across reloads
    private key: string;

    // account whose scopes are loading or loaded
    private account: string;

    // ready() is fetching the account itself
    private asking = false;

    constructor(private http: _HttpClient, private router: Router, private reuseTab: ReuseTabService) {
    }

    /**
     * After login: the scopes, each from the last pick, else the form's defaults, else none: the
     * page asks. A remembered pick is checked again, which also brings its
     * labels.
     */
    load(account: string): void {
        if (this.account === account) return;
        this.account = account;
        this.key = "erupt.scope:" + account;
        const last = this.read() || {};
        this.http.get<ScopeView[]>(RestPath.erupt + "/scope").pipe(catchError(() => of([]))).subscribe(scopes => {
            this.scopes = scopes || [];
            // a remembered pick the server no longer accepts (stale option, older storage shape) is
            // forgotten, so its error shows at most once instead of on every page load; the defaults
            // are never stored, so a changed default still reaches users who never picked
            let stale = false;
            const checked = this.scopes.map(s => !last[s.name] ? of(s.defaults)
                : this.check(s.name, last[s.name]).pipe(catchError(() => {
                    stale = true;
                    delete last[s.name];
                    return of(s.defaults);
                })));
            forkJoin(checked.length ? checked : [of(null)]).subscribe(picks => {
                ScopeStore.picks = {};
                this.scopes.forEach((s, i) => picks[i] && (ScopeStore.picks[s.name] = picks[i]));
                if (stale) {
                    this.write(last);
                }
                this.loaded$.next();
            });
        });
    }

    /**
     * Emits once the scopes and this window's picks are in. Loading starts here when nothing started
     * it yet: on a refresh of a model page its guard asks before the layout, which normally loads
     * the scopes, is even created.
     */
    ready(): Observable<void> {
        if (ShareSession.active() && !this.account) {
            // a share visitor has no account to ask for and no scope to pick: the page opens as it is
            this.account = "share";
            this.scopes = [];
            this.loaded$.next();
        } else if (!this.account && !this.asking) {
            this.asking = true;
            this.http.get<Userinfo>(RestPath.erupt + "/userinfo").subscribe(u => this.load(u.account));
        }
        return this.loaded$.pipe(take(1));
    }

    // scopes of an erupt model
    ofErupt(erupt: string): ScopeView[] {
        const name = (erupt || "").toLowerCase();
        return this.scopes.filter(s => (s.models || [s.parent]).some(m => m.toLowerCase() === name));
    }

    // scopes of the model a /build/table|tree|form/{name} page shows; other pages have none
    of(url: string): ScopeView[] {
        const match = /\/build\/(?:table|tree|form)\/([^/?#;]+)/.exec(url || "");
        return match ? this.ofErupt(decodeURIComponent(match[1])) : [];
    }

    // the first scope of a model still without a pick: its page must not open before one is made
    pending(erupt: string): ScopeView {
        return this.ofErupt(erupt).find(s => !ScopeStore.picks[s.name]);
    }

    current(scope: string): ScopeAccepted {
        return ScopeStore.picks[scope];
    }

    // "orbstack / demo": the labels of the picked values, in form order
    summary(scope: string): string {
        const pick = ScopeStore.picks[scope];
        const view = this.scopes.find(s => s.name === scope);
        return pick && view ? view.fields.map(f => pick.labels[f]).filter(l => !!l).join(" / ") : "";
    }

    /**
     * Switches this window's scope and rebuilds its open tabs, which still show the old one; then
     * opens target, by default the page it was picked on.
     */
    pick(scope: string, values: object, target?: string): Observable<ScopeAccepted> {
        return this.check(scope, values).pipe(tap(accepted => {
            ScopeStore.picks[scope] = accepted;
            this.remember();
            const url = target || this.router.url;
            this.reuseTab.clear(true);
            this.router.navigateByUrl("/", {skipLocationChange: true}).then(() => this.router.navigateByUrl(url));
        }));
    }

    private check(scope: string, values: object): Observable<ScopeAccepted> {
        return this.http.post<ScopeAccepted>(RestPath.erupt + "/scope/" + scope, values);
    }

    private remember(): void {
        const remembered = Object.fromEntries(Object.entries(ScopeStore.picks).map(([k, p]) => [k, p.values]));
        this.write(remembered);
    }

    private read(): { [scope: string]: object } {
        try {
            return JSON.parse(localStorage.getItem(this.key));
        } catch (e) {
            return null;
        }
    }

    private write(values: object): void {
        try {
            localStorage.setItem(this.key, JSON.stringify(values));
        } catch (e) {
            // storage unavailable: the pick still holds for this window
        }
    }

}
