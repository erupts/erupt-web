import {Component, DestroyRef, inject} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ActivatedRoute} from "@angular/router";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {MenuService} from "@delon/theme";
import {ScopeService, ScopeView} from "@shared/service/scope.service";

/**
 * Stands in for a model page whose scope has no pick yet (see scopeGuard): the scope's form, and
 * after the pick the page that was asked for.
 */
@Component({
    standalone: false,
    selector: "erupt-scope-gate",
    template: `
        <div class="scope-gate">
            @if (scope) {
                <div class="scope-gate__card">
                    <div class="scope-gate__title">
                        <i nz-icon nzType="cluster" nzTheme="outline"></i>
                        {{ 'scope.required' | translate }} {{ scope.title }}
                    </div>
                    <erupt-scope-form [scope]="scope" [target]="target"></erupt-scope-form>
                </div>
            }
        </div>
    `,
    styles: [`
        .scope-gate { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
        .scope-gate__card { padding: 20px 24px; border-radius: 8px; border: 1px solid var(--erupt-border, #d9d9d9);
            background: var(--erupt-bg-container, #fff); }
        .scope-gate__title { margin-bottom: 8px; font-size: 15px; font-weight: 500; color: var(--erupt-text, rgba(0, 0, 0, .88)); }
    `]
})
export class ScopeGateComponent {

    scope: ScopeView;

    // the page asked for; with none (a direct visit) the pick stays here
    target: string;

    constructor(route: ActivatedRoute, scopeService: ScopeService, reuseTab: ReuseTabService, menuSrv: MenuService) {
        // taken here, not inside the callbacks below: they run once the scopes arrive, outside the
        // injection context, where inject() may not be called
        const destroyed = inject(DestroyRef);
        // the tab bar lists the page it shows even when the route is never cached (reuse: false),
        // and no menu sits behind this route, so its raw path would show as the tab's title
        const retitle = () => {
            if (!this.scope) return;
            // the tab stands for the page waiting behind the gate: name it after that page's menu
            // entry, and after the scope itself only when the visit carries no target
            const path = this.target ? menuSrv.getPathByUrl(this.target.split("?")[0]) : [];
            reuseTab.title = path.length ? path[path.length - 1].text : this.scope.title;
        };
        // a hard load of this page builds it before the layout has fetched the scopes (the guard
        // waits for them, this route has none): wait, then follow the params — paramMap replays
        // its current value on subscribe
        scopeService.ready().pipe(takeUntilDestroyed(destroyed)).subscribe(() => {
            route.paramMap.pipe(takeUntilDestroyed(destroyed)).subscribe(params => {
                this.scope = scopeService.scopes.find(s => s.name === params.get("scope"));
                retitle();
            });
        });
        route.queryParamMap.pipe(takeUntilDestroyed(destroyed)).subscribe(params => {
            const target = params.get("target");
            // only an in-app path: it is handed to navigateByUrl
            this.target = target?.startsWith("/") && !target.startsWith("//") ? target : null;
            retitle();
        });
    }

}
