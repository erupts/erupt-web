import {Component, Input, OnInit} from '@angular/core';
import {IframeHeight} from "@shared/util/window.util";

@Component({
    selector: 'erupt-iframe',
    template: `
        <nz-spin [nzSpinning]="spin" style="height: 100%;width: 100%">
            <iframe [src]="url|safeUrl" height="100%"
                    style="width: 100%;border: 0;display: block;vertical-align: bottom;"
                    [ngStyle]="style"
                    (load)="iframeLoad($event)">

            </iframe>
        </nz-spin>
    `,
    styles: []
})
export class EruptIframeComponent implements OnInit {

    @Input() url: string | null;

    @Input() height: string | null;

    @Input() width: string | null;

    @Input() style: object = {};

    spin: boolean = true;

    constructor() {

    }

    ngOnInit() {
        this.spin = true;
        if (this.height) {
            this.style["height"] = this.height;
        }
        if (this.width) {
            this.style["width"] = this.width;
        }
        setTimeout(() => {
            this.spin = false;
        }, 3000)
    }

    iframeLoad(event: any) {
        this.spin = false;
        if (!this.height) {
            try {
                IframeHeight(event);
            } catch (e) {
                this.style["height"] = "600px"
                console.error(e)
            }
        }
        this.spin = false;
    };

}
