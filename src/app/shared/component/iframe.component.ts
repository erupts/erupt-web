import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {IframeHeight} from "@shared/util/window.util";

@Component({
    selector: 'erupt-iframe',
    template: `
        <nz-spin [nzSpinning]="spin">
            <iframe [src]="url|safeUrl" style="width: 100%;border: 0;display: block;vertical-align: bottom;"
                    [ngStyle]="style"
                    (load)="iframeLoad($event)">

            </iframe>
        </nz-spin>
    `,
    styles: []
})
export class EruptIframeComponent implements OnInit, OnChanges {

    @Input() url: string | null;

    @Input() height: string | null;

    @Input() width: string | null;

    @Input() style: object = {};

    spin: boolean = true;

    constructor() {

    }

    ngOnInit() {
        this.spin = true;
    }

    iframeLoad(event: any) {
        this.spin = false;
        if (this.height) {
            this.style["height"] = this.height;
        } else {
            try {
                IframeHeight(event);
            } catch (e) {
                this.style["height"] = "600px"
                console.error(e)
            }
        }
        if (this.width) {
            this.style["width"] = this.width;
        }
        this.spin = false;
    };

    ngOnChanges(changes: SimpleChanges): void {
        // if (!changes.url.firstChange) {
        //   this.spin = true;
        // }
    }


}
