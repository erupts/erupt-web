import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DataService} from "@shared/service/data.service";
import {Subscription} from "rxjs";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";

@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styles: []
})
export class SiteComponent implements OnInit, OnDestroy {

    url: string;

    targetUrl: string;

    spin: boolean = false;

    private router$: Subscription;

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                public route: ActivatedRoute, public dataService: DataService) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe((params) => {
            this.spin = true;
            let url = atob(decodeURIComponent(params.url));
            url += (url.indexOf("?") === -1 ? "?" : "&") + "_token=" + this.tokenService.get().token;
            this.url = url;
        });
    }

    iframeLoad() {
        this.spin = false;
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

}
