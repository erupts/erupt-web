import {Component, Input, OnInit} from '@angular/core';
import {IframeHeight} from "@shared/util/window.util";

@Component({
    selector: 'erupt-iframe',
    template: `
        <nz-spin [nzSpinning]="spin">
            <iframe [src]="url|safeUrl" style="width: 100%;border: 0;display: block" [ngStyle]="{height:height}" (load)="iframeHeight($event)">

            </iframe>
        </nz-spin>
    `,
    styles: []
})
export class EruptIframeComponent implements OnInit {


    @Input() url: string;

    height: number;

    spin: boolean = true;

    constructor() {

    }

    ngOnInit() {

    }

    iframeHeight(event) {
        this.spin = false;
        IframeHeight(event);
    };

}
