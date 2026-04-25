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

    spin: boolean = false;

    @HostBinding('class.managed')
    get managed(): boolean {
        return this.iframeManager.isInitialized();
    }

    private router$: Subscription;

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                private reuseTabService: ReuseTabService,
                public route: ActivatedRoute,
                public dataService: DataService,
                protected iframeManager: IframeManagerService) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe((params) => {
            this.spin = true;
            let url = decodeURIComponent(atob(decodeURIComponent(params["url"])));
            url += (url.indexOf("?") === -1 ? "?" : "&") + "_token=" + this.tokenService.get().token;
            this.url = url;
            if (this.iframeManager.isInitialized()) {
                this.iframeManager.show(url);
            }
        });
        setTimeout(() => {
            this.spin = false;
        }, 3000)
    }

    // called by ReuseTabService when this tab is switched back to
    _onReuseInit() {
        if (this.url && this.iframeManager.isInitialized()) {
            this.iframeManager.show(this.url);
        }
    }

    iframeLoad() {
        this.spin = false;
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
        if (this.url && this.iframeManager.isInitialized()) {
            this.iframeManager.remove(this.url);
        }
    }

}
