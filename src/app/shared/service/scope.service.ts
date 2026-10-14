import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {_HttpClient} from "@delon/theme";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {forkJoin, Observable, of, tap} from "rxjs";
import {catchError} from "rxjs/operators";
import {RestPath} from "../../build/erupt/model/erupt.enum";

/** A signed scope pick, as the server returns it */
export interface ScopeAccepted {
    token: string;
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

    static header(): string {
        return Object.values(ScopeStore.picks).map(p => p.token).join(",");
    }

    static value(scope: string, field: string): any {
        const pick = ScopeStore.picks[scope];
        return pick ? pick.values[field] : null;
    }

}

@Injectable({providedIn: "root"})
export class ScopeService {

    scopes: ScopeView[] = [];

    // the last pick of each scope, so a new window starts where the user left off
    private key: string;

    constructor(private http: _HttpClient, private router: Router, private reuseTab: ReuseTabService) {
    }

    /**
     * After login: the scopes, each signed afresh from this window's pick, else the last one, else
     * the server's defaults. Signing again checks the values against the options once more.
     */
    load(account: string): void {
        this.key = "erupt.scope:" + account;
        const last = this.read(sessionStorage) || this.read(localStorage) || {};
        this.http.get<ScopeView[]>(RestPath.erupt + "/scope").subscribe(scopes => {
            this.scopes = scopes || [];
            const signed = this.scopes.map(s => !last[s.name] ? of(s.defaults)
                : this.sign(s.name, last[s.name]).pipe(catchError(() => of(s.defaults))));
            forkJoin(signed.length ? signed : [of(null)]).subscribe(picks => {
                ScopeStore.picks = {};
                this.scopes.forEach((s, i) => picks[i] && (ScopeStore.picks[s.name] = picks[i]));
            });
        });
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
     * Switches this window's scope and rebuilds its open tabs, which still show the old one.
     */
    pick(scope: string, values: object): Observable<ScopeAccepted> {
        return this.sign(scope, values).pipe(tap(accepted => {
            ScopeStore.picks[scope] = accepted;
            const remembered = Object.fromEntries(Object.entries(ScopeStore.picks).map(([k, p]) => [k, p.values]));
            this.write(sessionStorage, remembered);
            this.write(localStorage, remembered);
            const url = this.router.url;
            this.reuseTab.clear(true);
            this.router.navigateByUrl("/", {skipLocationChange: true}).then(() => this.router.navigateByUrl(url));
        }));
    }

    private sign(scope: string, values: object): Observable<ScopeAccepted> {
        return this.http.post<ScopeAccepted>(RestPath.erupt + "/scope/" + scope, values);
    }

    private read(storage: Storage): { [scope: string]: object } {
        try {
            return JSON.parse(storage.getItem(this.key));
        } catch (e) {
            return null;
        }
    }

    private write(storage: Storage, values: object): void {
        try {
            storage.setItem(this.key, JSON.stringify(values));
        } catch (e) {
            // storage unavailable: the pick still holds for this window
        }
    }

}
