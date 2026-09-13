import {Location} from '@angular/common';
import {ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router} from '@angular/router';
import {ReuseTabService} from '@delon/abc/reuse-tab';
import {timer} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';

/** Same shape as delon's (non-exported) ReuseTitle */
interface ReuseTabTitle {
    text?: string;
    i18n?: string;
}

/** Deepest active child of the snapshot, the one delon reads route `data` from */
function truthRoute(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let next = snapshot;
    while (next.firstChild) {
        next = next.firstChild;
    }
    return next;
}

/**
 * True when the tab of `route` has no menu / route-data title, i.e. delon fell back to showing the raw URL.
 */
export function isReuseTabTitleUnresolved(reuseTab: ReuseTabService, route: ActivatedRoute): boolean {
    const url = reuseTab.getUrl(route.snapshot);
    const title = reuseTab.getTitle(url, truthRoute(route.snapshot)) as ReuseTabTitle;
    return title.text === url;
}

/**
 * Give the tab of `route` its real name (host name, canvas name, dashboard name...) once the page has
 * loaded it. Menu-linked pages keep the title configured on the menu: only an unresolved tab is touched,
 * so the same component can serve both a menu entry and a row-operation link.
 *
 * Safe to call when tab reuse is disabled (the cached title is simply never rendered).
 */
export function setReuseTabTitle(reuseTab: ReuseTabService, route: ActivatedRoute, text: string): void {
    if (!text || !isReuseTabTitleUnresolved(reuseTab, route)) {
        return;
    }
    const url = reuseTab.getUrl(route.snapshot);
    // reuse-tab registers a page that is not a menu item in its cached list as soon as it becomes the current
    // tab (`saveCache(snapshot, null)`), freezing the placeholder title in that entry. The `title` setter only
    // updates the title cache and the rendered tab, so the list is rebuilt with the placeholder as soon as the
    // user leaves the page: keep the entry in sync as well.
    const item = reuseTab.items.find(i => i.url === url);
    if (item) {
        item.title = {text};
    }
    if (url === reuseTab.curUrl) {
        reuseTab.title = text;
    } else if (item) {
        // The data arrived after the user moved to another tab
        reuseTab.refresh();
    }
}

/**
 * "Back" button of a page that is not a menu item: go back to the opener page and drop this page's tab.
 * Such a tab has no cached component (reuse-tab never detaches a non-menu route), so keeping it would only
 * leave a placeholder that reloads the page when clicked.
 *
 * Goes back first, then closes the tab once that navigation settled: closing the active tab directly makes
 * reuse-tab jump to a neighbouring tab, which is not necessarily the opener.
 */
export function leaveReuseTab(reuseTab: ReuseTabService, router: Router, location: Location, fallbackUrl: string = '/'): void {
    const url = reuseTab.curUrl;
    if (reuseTab.items.some(i => i.url === url)) {
        router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            take(1),
            takeUntil(timer(5000))
        ).subscribe(() => {
            if (reuseTab.curUrl !== url) {
                reuseTab.close(url, true);
            }
        });
    }
    if (window.history.length > 1) {
        location.back();
    } else {
        router.navigateByUrl(fallbackUrl);
    }
}
