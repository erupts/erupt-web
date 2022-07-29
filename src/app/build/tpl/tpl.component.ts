import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
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

    renderType: 'micro-app' | 'iframe' = "iframe";

    name: string;

    spin: boolean = true;

    @ViewChild('micro', {static: false}) microApp: ElementRef;

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
            //this.name = url.substring(url.indexOf(tpl) + tpl.length);
            //初测发现此处会造成使用fill/tpl/xx时会造成页面无法全屏的问题，暂时使用上个版本代码替换！！
            this.name = params.name;
            console.log(this.name);
            this.url = this.dataService.getEruptTpl(this.name);
            if (this.renderType === 'micro-app') {
                this.url = window.location.origin + window.location.pathname + this.url;
            }
        });
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
        let appName = this.microApp && this.microApp.nativeElement && this.microApp.nativeElement.appName;
        if (appName) {
            // 卸载micro-app
            (window as any).exports.unmountApp(appName, {clearAliveState: true}).then(() => {
                // 卸载成功
            });
        }
    }

    iframeLoad() {
        this.spin = false;
    }

}
