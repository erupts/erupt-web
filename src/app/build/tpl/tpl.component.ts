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

    //是否使用微前端嵌入
    micro: boolean = false;

    private router$: Subscription;

    constructor(private dataService: DataService,
                public settingSrv: SettingsService,
                private router: Router,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe(() => {
            let url = this.router.url;
            let tpl = '/tpl/';
            let mtpl = '/mtpl/';
            if (url.startsWith(mtpl)) {
                tpl = mtpl;
            }
            this.name = url.substring(url.indexOf(tpl) + tpl.length);
            this.url = this.dataService.getEruptTpl(this.name);
            this.micro = this.route.snapshot.data['micro']
        });

    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

}
