import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ReportDSL, ReportType} from "../../model/dashboard.model";
import {safeSrc} from "../../model/screen-widget";

/**
 * A widget of a data screen: decoration or static content (label, image, border, divider, clock, web page,
 * video). It shows no data, so it is not a cube-puzzle-report; everything it draws comes from `report.ui`.
 */
@Component({
    selector: 'cube-screen-widget',
    standalone: false,
    templateUrl: './cube-screen-widget.html',
    styleUrl: './cube-screen-widget.less'
})
export class CubeScreenWidget implements OnInit, OnDestroy {

    @Input() report: ReportDSL;

    now = new Date();

    private timer: any;

    // the trusted form of the last web page address, rebuilt only when the address changes:
    // a new object on every check would reload the frame
    private frameSrc: string | null = null;

    private frameUrl: SafeResourceUrl | null = null;

    constructor(private sanitizer: DomSanitizer) {
    }

    ngOnInit(): void {
        if (this.report.type === ReportType.CLOCK) {
            this.timer = setInterval(() => this.now = new Date(), 1000);
        }
    }

    ngOnDestroy(): void {
        clearInterval(this.timer);
    }

    get ui(): Record<string, any> {
        return this.report.ui || {};
    }

    /** The address of an image or a video, or null while it is missing or not one this page may load */
    get src(): string | null {
        return safeSrc(this.ui['src']);
    }

    /** The address of an embedded page; only an http(s) or site address ever reaches the frame */
    get pageUrl(): SafeResourceUrl | null {
        const src = this.src;
        if (src !== this.frameSrc) {
            this.frameSrc = src;
            this.frameUrl = src ? this.sanitizer.bypassSecurityTrustResourceUrl(src) : null;
        }
        return this.frameUrl;
    }

    protected readonly ReportType = ReportType;
}
