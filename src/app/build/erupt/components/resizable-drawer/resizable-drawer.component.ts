import {ChangeDetectorRef, Component, Input, OnInit, Type, ViewChild, ViewContainerRef} from '@angular/core';
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
            <ng-container #outlet></ng-container>
        </div>
    `,
    styles: [`
        .erupt-resizable-drawer {
            position: relative;
            width: 100%;
            height: 100%;
        }
    `]
})
export class ResizableDrawerComponent implements OnInit {

    @Input() content: Type<any>;

    @Input() params: object;

    // remembers the size per drawer in localStorage when set
    @Input() storageKey: string;

    @ViewChild('outlet', {read: ViewContainerRef, static: true}) outlet: ViewContainerRef;

    readonly minSize = MIN_SIZE;

    direction: NzResizeDirection = 'left';

    private horizontal = true;

    private frame = -1;

    constructor(private drawerRef: NzDrawerRef, private cdr: ChangeDetectorRef) {
    }

    ngOnInit() {
        const placement = this.drawerRef.nzPlacement || 'right';
        this.horizontal = placement === 'left' || placement === 'right';
        this.direction = HANDLE_BY_PLACEMENT[placement];
        if (this.storageKey) {
            const saved = Number(localStorage.getItem(STORAGE_PREFIX + this.storageKey));
            if (saved >= MIN_SIZE) this.applySize(saved);
        }
        const ref = this.outlet.createComponent(this.content);
        Object.assign(ref.instance, this.params || {});
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
