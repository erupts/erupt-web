import {Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {SettingsService} from "@delon/theme";
import {IframeManagerService} from "@shared/service/iframe-manager.service";

@Component({
    standalone: false,
    selector: 'app-tpl',
    templateUrl: './tpl.component.html',
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
export class TplComponent implements OnInit, OnDestroy {

    url: string;

    name: string;

    micro: boolean = false;

    @HostBinding('class.managed')
    get managed(): boolean {
        return this.iframeManager.isInitialized() && !this.micro;
    }

    private router$: Subscription;

    constructor(private dataService: DataService,
                public settingSrv: SettingsService,
                private router: Router,
                public route: ActivatedRoute,
                protected iframeManager: IframeManagerService) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe(() => {
            const routerUrl = this.router.url;
            let tpl = '/tpl/';
            const mtpl = '/mtpl/';
            if (routerUrl.startsWith(mtpl)) {
                tpl = mtpl;
            }
            this.name = routerUrl.substring(routerUrl.indexOf(tpl) + tpl.length);
            this.url = this.dataService.getEruptTpl(this.name);
            this.micro = this.route.snapshot.data['micro'];
            if (!this.micro) {
                this.iframeManager.show(this.url);
            }
        });
    }

    _onReuseInit() {
        if (this.url && !this.micro) {
            this.iframeManager.show(this.url);
        }
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
        if (this.url && !this.micro) {
            this.iframeManager.remove(this.url);
        }
    }

}
