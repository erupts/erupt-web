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

    renderType: string;

    microName: string;

    microUrl: string;

    spin: boolean = true;

    @ViewChild('micro', {static: false}) microApp: ElementRef;


    private router$: Subscription;

    constructor(private dataService: DataService,
                public settingSrv: SettingsService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe((params) => {
            // TODO: 应该从dataService中获取渲染类型
            this.renderType = 'micro-app'; // micro-app, iframe
            this.microName = params.name;
            this.url = this.dataService.getEruptTpl(params.name);
            this.microUrl = (window as any).location.origin +"/" + this.url
        });
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
        var appName = this.microApp && this.microApp.nativeElement && this.microApp.nativeElement.appName;
        if(appName) {
            // 卸载micro-app
            (window as any).exports.unmountApp(appName, { clearAliveState: true }).then(() => {
                // 卸载成功
            })
        }
    }

    iframeLoad() {
        this.spin = false;
    }

}
