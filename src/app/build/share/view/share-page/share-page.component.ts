import {Component, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {I18NService} from "@core";
import {ShareSession} from "@shared/model/share-session";
import {RestPath} from "../../../erupt/model/erupt.enum";

/**
 * The template page a PAGE link opens, framed full screen under the share session rather than
 * the login token the tpl route would use.
 */
@Component({
    standalone: false,
    selector: "erupt-share-page",
    template: `
        @if (url) {
            <iframe [src]="url | safeUrl" class="share-page" [frameBorder]="0"></iframe>
        }
    `,
    styles: [`.share-page {
        display: block;
        width: 100%;
        height: 100vh;
        border: 0;
    }`]
})
export class SharePageComponent implements OnInit, OnDestroy {

    url: string | null = null;

    private router$: Subscription;

    constructor(private router: Router, private route: ActivatedRoute, private i18n: I18NService) {
    }

    ngOnInit(): void {
        this.router$ = this.route.url.subscribe(segments => {
            const path = segments.map(it => it.path).join("/");
            const query = this.router.url.indexOf("?") === -1 ? "" : this.router.url.substring(this.router.url.indexOf("?") + 1) + "&";
            this.url = RestPath.tpl + "/" + path + "?" + query + "_token=" + (ShareSession.token() || "") + "&_lang=" + this.i18n.currentLang;
        });
    }

    ngOnDestroy(): void {
        this.router$?.unsubscribe();
    }
}
