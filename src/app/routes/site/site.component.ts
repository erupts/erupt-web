import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DataService} from "@shared/service/data.service";
import {Subscription} from "rxjs";

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

    constructor(public route: ActivatedRoute, public dataService: DataService) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe((params) => {
            this.spin = true;
            this.url = atob(decodeURIComponent(params.url));
        });
    }

    iframeLoad() {
        this.spin = false;
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

}
