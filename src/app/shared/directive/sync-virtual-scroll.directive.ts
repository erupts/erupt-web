import {AfterViewInit, Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

@Directive({
    selector: '[syncVirtualScroll]'
})
export class SyncVirtualScrollDirective implements AfterViewInit, OnChanges {


    @Input('syncVirtualScroll') enabled: boolean = true;

    private inited = false;

    constructor(private el: ElementRef<HTMLElement>) {
    }

    ngAfterViewInit(): void {
        this.inited = true;
        if (this.enabled) {
            this.initScrollSync();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.inited) return;
        if (changes['enabled']) {
            this.initScrollSync();
        }
    }

    private initScrollSync(): void {
        setTimeout(() => {
            const host = this.el.nativeElement;
            const body = host.querySelector('.cdk-virtual-scroll-viewport, .ant-table-body') as HTMLElement;
            const header = host.querySelector('.ant-table-header') as HTMLElement;
            if (body && header) {
                header.scrollLeft = body.scrollLeft
                body.addEventListener('scroll', () => {
                    header.scrollLeft = body.scrollLeft
                });
            }
        }, 200)
    }
}
