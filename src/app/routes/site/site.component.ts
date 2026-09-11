import {Component, HostBinding, Inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DataService} from "@shared/service/data.service";
import {Subscription} from "rxjs";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {IframeManagerService} from "@shared/service/iframe-manager.service";

@Component({
    standalone: false,
    selector: 'app-site',
    templateUrl: './site.component.html',
    styles: [
        `
            :host {
                height: 100%;
                overflow: auto;
            }
            :host.managed {
                display: none !important;
            }
        `
    ]
})
export class SiteComponent implements OnInit, OnDestroy {

    url: string;

    targetUrl: string;

    /** Route data flag: render through the micro-frontend container instead of an iframe. */
    micro: boolean = false;

    spin: boolean = false;

    @HostBinding('class.managed')
    get managed(): boolean {
        return this.iframeManager.isInitialized() && !this.micro;
    }

    private router$: Subscription;

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                private reuseTabService: ReuseTabService,
                public route: ActivatedRoute,
                public dataService: DataService,
                protected iframeManager: IframeManagerService) {
    }

    ngOnInit() {
        this.micro = !!this.route.snapshot.data['micro'];
        this.router$ = this.route.params.subscribe((params) => {
            this.spin = true;
            let url = decodeURIComponent(atob(decodeURIComponent(params["url"])));
            // The micro-frontend container fetches the page itself, so the token rides in a
            // header the sub app sets, not in a query string that would leak into its logs.
            if (!this.micro) {
                url += (url.indexOf("?") === -1 ? "?" : "&") + "_token=" + this.tokenService.get().token;
            }
            this.url = url;
            if (!this.micro && this.iframeManager.isInitialized()) {
                this.iframeManager.show(url);
            }
        });
        setTimeout(() => {
            this.spin = false;
        }, 3000)
    }

    // called by ReuseTabService when this tab is switched back to
    _onReuseInit() {
        if (!this.micro && this.url && this.iframeManager.isInitialized()) {
            this.iframeManager.show(this.url);
        }
    }

    iframeLoad() {
        this.spin = false;
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
        if (!this.micro && this.url && this.iframeManager.isInitialized()) {
            this.iframeManager.remove(this.url);
        }
    }

}
