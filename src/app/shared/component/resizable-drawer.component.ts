import {
    ApplicationRef, ChangeDetectorRef, Component, ComponentRef, createComponent, ElementRef, EnvironmentInjector,
    Injector, Input, OnDestroy, OnInit, Type, ViewChild
} from '@angular/core';
import {NzDrawerOptions, NzDrawerRef, NzDrawerService} from "ng-zorro-antd/drawer";
import {NzResizeDirection, NzResizeEvent} from "ng-zorro-antd/resizable";

const MIN_SIZE = 280;

const STORAGE_PREFIX = "erupt-drawer-size:";

// the handle sits on the drawer's inner edge, opposite to the side it is anchored on
const HANDLE_BY_PLACEMENT: Record<string, NzResizeDirection> = {
    right: 'left', left: 'right', top: 'bottom', bottom: 'top'
};

/**
 * Drawer body that hosts another component and lets the user drag the drawer's inner edge
 * to change its width (left / right placement) or height (top / bottom), built on
 * nz-resizable the same way the ng-zorro "resizable drawer" demo does. Open one through
 * {@link openResizableDrawer} instead of using the component directly.
 */
@Component({
    standalone: false,
    selector: 'erupt-resizable-drawer',
    template: `
        <div class="erupt-resizable-drawer" nz-resizable nzBounds="window"
             [nzMinWidth]="minSize" [nzMinHeight]="minSize"
             (nzResize)="onResize($event)">
            <nz-resize-handles [nzDirections]="[direction]"></nz-resize-handles>
            <div #outlet class="erupt-resizable-drawer__content"></div>
        </div>
    `,
    styles: [`
        .erupt-resizable-drawer {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .erupt-resizable-drawer__content {
            height: 100%;
        }
    `]
})
export class ResizableDrawerComponent implements OnInit, OnDestroy {

    @Input() content: Type<any>;

    @Input() params: object;

    // remembers the size per drawer in localStorage when set
    @Input() storageKey: string;

    @ViewChild('outlet', {static: true}) outlet: ElementRef<HTMLElement>;

    readonly minSize = MIN_SIZE;

    direction: NzResizeDirection = 'left';

    private horizontal = true;

    private frame = -1;

    private contentRef?: ComponentRef<any>;

    constructor(private drawerRef: NzDrawerRef,
                private cdr: ChangeDetectorRef,
                private appRef: ApplicationRef,
                private injector: Injector,
                private envInjector: EnvironmentInjector) {
    }

    ngOnInit() {
        const placement = this.drawerRef.nzPlacement || 'right';
        this.horizontal = placement === 'left' || placement === 'right';
        this.direction = HANDLE_BY_PLACEMENT[placement];
        if (this.storageKey) {
            const saved = Number(localStorage.getItem(STORAGE_PREFIX + this.storageKey));
            if (saved >= MIN_SIZE) this.applySize(saved);
        }
        // nz-drawer is OnPush: a content view created inside its view container is skipped by the
        // zone ticks that follow (data arriving over HTTP would only show up on the next click).
        // The content is therefore attached to ApplicationRef as a root view, checked on every
        // tick, while its element is placed inside the resizable box; the element injector keeps
        // NzDrawerRef and the rest of the drawer's injector chain reachable for the content.
        this.contentRef = createComponent(this.content, {
            environmentInjector: this.envInjector,
            elementInjector: this.injector
        });
        Object.assign(this.contentRef.instance, this.params || {});
        this.outlet.nativeElement.appendChild(this.contentRef.location.nativeElement);
        this.appRef.attachView(this.contentRef.hostView);
    }

    ngOnDestroy() {
        cancelAnimationFrame(this.frame);
        // destroying the ref also detaches its view from ApplicationRef
        this.contentRef?.destroy();
    }

    onResize({width, height}: NzResizeEvent) {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => {
            const size = this.horizontal ? width : height;
            this.applySize(size);
            if (this.storageKey) {
                try {
                    localStorage.setItem(STORAGE_PREFIX + this.storageKey, String(size));
                } catch {
                }
            }
        });
    }

    private applySize(size: number) {
        if (this.horizontal) {
            this.drawerRef.nzWidth = size;
        } else {
            this.drawerRef.nzHeight = size;
        }
        // the drawer view is an ancestor of this one; mark the path so its width binding re-renders
        this.cdr.markForCheck();
    }

}

/**
 * Opens a drawer whose size the user can drag; same options as NzDrawerService.create, the
 * content component and its params are wrapped in {@link ResizableDrawerComponent}.
 */
export function openResizableDrawer(drawerService: NzDrawerService, options: NzDrawerOptions<any>, storageKey?: string): NzDrawerRef {
    return drawerService.create({
        ...options,
        nzContent: ResizableDrawerComponent,
        nzContentParams: {content: options.nzContent, params: options.nzContentParams, storageKey}
    });
}
