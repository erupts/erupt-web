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

    renderType: string;

    microName: string;

    microUrl: string;

    spin: boolean = true;


    private router$: Subscription;

    constructor(private dataService: DataService,
                public settingSrv: SettingsService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
        this.router$ = this.route.params.subscribe((params) => {
            this.url = this.dataService.getEruptTpl(params.name);
            // TODO: 应该从dataService中获取渲染类型
            this.renderType = 'micro-app'; // micro-app, iframe
            this.microName = params.name;
            this.microUrl = (window as any).location.origin +"/" + this.url
            // TODO: 模拟micro-app加载完成
            if(this.renderType === 'micro-app'){
                setTimeout(() => {
                    this.spin = false; 
                }, 1000);
            }
        });
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

    iframeLoad() {
        this.spin = false;
    }

}
