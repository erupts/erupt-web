import {AfterViewInit, Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

@Directive({
    selector: '[syncVirtualScroll]'
})
export class SyncVirtualScrollDirective implements AfterViewInit, OnChanges {


    @Input('syncVirtualScroll') enabled: boolean = true;

    private inited = false;

    constructor(private el: ElementRef<HTMLElement>) {}

    ngAfterViewInit(): void {
        this.inited = true;
        if (this.enabled) {
            this.initScrollSync();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.inited) return;
        if (changes['enabled']) {
            if (this.enabled) {
                this.initScrollSync();
            } else {
                this.removeScrollSync();
            }
        }
    }

    private removeScrollSync() {
        const body = this.el.nativeElement.querySelector('.ant-table-body');
        if (body && this.scrollHandler) {
            body.removeEventListener('scroll', this.scrollHandler);
        }
    }

    private scrollHandler = () => {};

    private initScrollSync(): void {
        const host = this.el.nativeElement;
        const body = host.querySelector('.cdk-virtual-scroll-viewport') as HTMLElement;
        const header = host.querySelector('.ant-table-header') as HTMLElement;

        if (body && header) {
            this.scrollHandler = () => {
                header.scrollLeft = body.scrollLeft;
            };
            body.addEventListener('scroll', this.scrollHandler);
        }
    }
}
