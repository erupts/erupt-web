import {Component, ElementRef, Inject, OnInit, Renderer2} from '@angular/core';
import {NavigationEnd, NavigationError, RouteConfigLoadStart, Router} from '@angular/router';
import {TitleService, VERSION as VERSION_ALAIN} from '@delon/theme';
import {environment} from '@env/environment';
import {NzModalService} from 'ng-zorro-antd/modal';
import {VERSION as VERSION_ZORRO} from 'ng-zorro-antd/version';
import {WindowModel} from "@shared/model/window.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {DomSanitizer} from "@angular/platform-browser";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {Skin, switchSkin} from "@shared/util/theme.util";

@Component({
    selector: 'app-root',
    template: `
        <router-outlet></router-outlet>
    `,
    standalone: false
})
export class AppComponent implements OnInit {
    constructor(
        el: ElementRef,
        renderer: Renderer2,
        private router: Router,
        private titleSrv: TitleService,
        private modalSrv: NzModalService,
        private sanitizer: DomSanitizer,
        @Inject(NzModalService) private modal: NzModalService,
        @Inject(NzMessageService) private msg: NzMessageService,
        @Inject(NzNotificationService) private notification: NzNotificationService,
        private nzConfigService: NzConfigService
    ) {
        renderer.setAttribute(el.nativeElement, 'ng-alain-version', VERSION_ALAIN.full);
        renderer.setAttribute(el.nativeElement, 'ng-zorro-version', VERSION_ZORRO.full);
        renderer.setAttribute(el.nativeElement, 'ng-erupt-version', VERSION_ALAIN.full);
    }

    beforeMatch = null;

    ngOnInit(): void {
        window["msg"] = this.msg;
        window["modal"] = this.modal;
        window["notify"] = this.notification;
        window["safeHtml"] = (html: string) => {
            return this.sanitizer.bypassSecurityTrustHtml(html);
        };
        // Skin switch for scripts outside Angular (the home page iframe): goes
        // through the same path as the settings drawer, so the theme color and
        // the header bar follow the skin instead of only the <html> class.
        window["eruptApplySkin"] = (skin: string) => switchSkin(this.nzConfigService, skin as Skin);
        let configLoad = false;
        this.router.events.subscribe(ev => {
            if (ev instanceof RouteConfigLoadStart) {
                configLoad = true;
            }
            if (configLoad && ev instanceof NavigationError) {
                this.modalSrv.confirm({
                    nzTitle: `Reminder`,
                    nzContent: environment.production ? `A new version may have been released. Please click refresh to apply changes.` : `Failed to load route: ${ev.url}`,
                    nzCancelDisabled: false,
                    nzOkText: 'Refresh',
                    nzCancelText: 'Ignore',
                    nzOnOk: () => location.reload()
                });
            }
            if (ev instanceof NavigationEnd) {
                this.titleSrv.setTitle();
                // this.modalSrv.closeAll();
                if (WindowModel.eruptRouterEvent) {
                    let url: string = ev["url"];
                    url = url.substring(0, (url.indexOf("?") === -1 ? url.length : url.indexOf("?")));
                    let paths = url.split("/");
                    let match = paths[paths.length - 1];
                    if (match != this.beforeMatch) {
                        if (this.beforeMatch) {
                            if (WindowModel.eruptRouterEvent.$) {
                                WindowModel.eruptRouterEvent.$.unload && WindowModel.eruptRouterEvent.$.unload(ev);
                            }
                            let beforeEvent = WindowModel.eruptRouterEvent[this.beforeMatch];
                            beforeEvent && beforeEvent.unload && beforeEvent.unload(ev);
                        }
                        let event = WindowModel.eruptRouterEvent[match];
                        if (WindowModel.eruptRouterEvent.$) {
                            WindowModel.eruptRouterEvent.$.load && WindowModel.eruptRouterEvent.$.load(ev);
                        }
                        event && event.load && event.load(ev);
                    }
                    this.beforeMatch = match;
                }
            }
        });
    }
}
