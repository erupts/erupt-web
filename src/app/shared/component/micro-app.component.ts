import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import microApp from '@micro-zoe/micro-app'
import {ContextKey, EruptContextService} from "@shared/service/erupt-context.service";

@Component({
    selector: 'erupt-micro-app',
    template: `
        <micro-app #microApp name="erupt-micro-app-ele" id="erupt-micro-app-ele"
                   style="width: 100%;height: 100%;display: block">

        </micro-app>
    `,
    styles: [],
    styleUrls: ['./micro-app.component.less'],
})
export class EruptMicroAppComponent implements AfterViewInit {

    @Input() url: string | null;

    spin: boolean = false;

    @ViewChild('microApp') microApp: ElementRef;

    constructor(private eruptContextService: EruptContextService) {
        if (!this.eruptContextService.has(ContextKey.INIT_MICRO_APP)) {
            this.eruptContextService.set(ContextKey.INIT_MICRO_APP, true);
            microApp.start({
                'router-mode': 'native',
                // shadowDOM: true
            });
        }
    }

    ngAfterViewInit() {
        this.microApp.nativeElement.setAttribute('url', this.url);
    }


}
