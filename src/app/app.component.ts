import {Component, ElementRef, Inject, OnInit, Renderer2} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {TitleService, VERSION as VERSION_ALAIN} from '@delon/theme';
import {NzModalService, VERSION as VERSION_ZORRO} from 'ng-zorro-antd';
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Component({
    selector: 'app-root',
    template: `
        <router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
    constructor(
        el: ElementRef,
        renderer: Renderer2,
        private router: Router,
        private titleSrv: TitleService,
        private modalSrv: NzModalService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
    ) {
        renderer.setAttribute(
            el.nativeElement,
            'ng-alain-version',
            VERSION_ALAIN.full,
        );
        renderer.setAttribute(
            el.nativeElement,
            'ng-zorro-version',
            VERSION_ZORRO.full,
        );
    }

    beforeMatch = null;

    ngOnInit() {
        const eruptEvent = window["eruptEvent"];
        this.router.events
            .pipe(filter(evt => evt instanceof NavigationEnd))
            .subscribe((res) => {
                this.titleSrv.setTitle();
                this.modalSrv.closeAll();
                //页面生命周期函数核心逻辑
                if (eruptEvent) {
                    let url: string = res["url"];
                    url = url.substring(0, (url.indexOf("?") === -1 ? url.length : url.indexOf("?")));
                    let paths = url.split("/");
                    let match = paths[paths.length - 1];
                    if (this.beforeMatch) {
                        eruptEvent[this.beforeMatch] && eruptEvent[this.beforeMatch].unload &&
                        eruptEvent[this.beforeMatch].unload(res, this.tokenService.get().token);
                    }
                    eruptEvent[match] && eruptEvent[match].load && eruptEvent[match].load(res, this.tokenService.get().token);
                    this.beforeMatch = match;
                }
            });
    }
}
