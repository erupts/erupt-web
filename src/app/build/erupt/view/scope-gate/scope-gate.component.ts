import {Component, DestroyRef, inject} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ActivatedRoute} from "@angular/router";
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

    constructor(route: ActivatedRoute, scopeService: ScopeService) {
        // the component is reused from one model page to the next: follow the params
        route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params =>
            this.scope = scopeService.scopes.find(s => s.name === params.get("scope")));
        route.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params => {
            const target = params.get("target");
            // only an in-app path: it is handed to navigateByUrl
            this.target = target?.startsWith("/") && !target.startsWith("//") ? target : null;
        });
    }

}
