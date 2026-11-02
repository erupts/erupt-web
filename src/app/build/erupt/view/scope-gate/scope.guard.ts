import {inject} from "@angular/core";
import {CanActivateFn, RedirectCommand, Router} from "@angular/router";
import {map} from "rxjs";
import {ScopeService} from "@shared/service/scope.service";

/**
 * Holds a model page until the scopes are in, and sends it to the scope page while one of its scopes
 * has no pick, so the page never runs, nor sends a request, outside a scope it needs. The address
 * bar keeps the page's url: a refresh asks again, and the scope page returns to it after the pick.
 */
export const scopeGuard: CanActivateFn = (route, state) => {
    const scopeService = inject(ScopeService);
    const router = inject(Router);
    return scopeService.ready().pipe(map(() => {
        const scope = scopeService.pending(route.paramMap.get("name"));
        if (!scope) return true;
        // the target rides in the url: the scope page is reused from one model page to the next
        return new RedirectCommand(router.createUrlTree(["/build/scope", scope.name], {queryParams: {target: state.url}}),
            {skipLocationChange: true});
    }));
};
