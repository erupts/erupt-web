import {Component, OnDestroy, OnInit} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {SettingsService} from "@delon/theme";

@Component({
    selector: 'app-tpl',
    templateUrl: './tpl.component.html'
})
export class TplComponent implements OnInit, OnDestroy {

    url: string;

    name: string;

    spin: boolean = true;

    private router$: Subscription;

    constructor(private dataService: DataService,
                public settingSrv: SettingsService,
                private router: Router,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe((params) => {
            let url = this.router.url;
            let tpl = '/tpl/';
            this.name = url.substring(url.indexOf(tpl) + tpl.length);
            this.url = this.dataService.getEruptTpl(this.name);
        });
        setTimeout(() => {
            this.spin = false;
        }, 3000)
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    iframeLoad() {
        this.spin = false;
    }

}
