import {inject} from "@angular/core";
import {CanActivateFn, RedirectCommand, Router} from "@angular/router";
import {map, switchMap} from "rxjs";
import {ScopeService} from "@shared/service/scope.service";

/**
 * Holds a model page until the scopes are in, and sends it to the scope page while one of its scopes
 * has no pick, so the page never runs, nor sends a request, outside a scope it needs. The address
 * bar keeps the page's url: a refresh asks again, and the scope page returns to it after the pick.
 *
 * The page's url names the scope it is built in (`?scope=`), so a link opens where it was copied:
 * picks a link carries are taken over first, then the url is brought in line with the picks the
 * page really gets, which also drops a pick the user may not make.
 */
export const scopeGuard: CanActivateFn = (route, state) => {
    const scopeService = inject(ScopeService);
    const router = inject(Router);
    const erupt = route.paramMap.get("name");
    const linked = route.queryParamMap.get(ScopeService.PARAM);
    const open = () => {
        const scope = scopeService.pending(erupt);
        if (scope) {
            // the target rides in the url: the scope page is reused from one model page to the next
            return new RedirectCommand(router.createUrlTree(["/build/scope", scope.name], {queryParams: {target: state.url}}),
                {skipLocationChange: true});
        }
        const current = scopeService.param(erupt);
        if (current === linked) return true;
        const tree = router.parseUrl(state.url);
        if (current) {
            tree.queryParams[ScopeService.PARAM] = current;
        } else {
            delete tree.queryParams[ScopeService.PARAM];
        }
        return new RedirectCommand(tree, {replaceUrl: true});
    };
    return scopeService.ready().pipe(
        switchMap(() => linked && linked !== scopeService.param(erupt) ? scopeService.adopt(erupt, linked) : [undefined]),
        map(open)
    );
};
