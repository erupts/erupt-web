import {Component, HostListener, Inject} from "@angular/core";
import {CdkDragEnd} from "@angular/cdk/drag-drop";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {AiLauncherService} from "@shared/service/ai-launcher.service";
import {AI_ICON} from "@shared/util/ai-icon";

interface Point {
    x: number;
    y: number;
}

// The AI assistant as a floating button in the bottom right corner of the
// shell. A click opens the chat drawer; a right click offers the full page,
// docking the entry back into the header toolbar and, once the button has
// been dragged somewhere, putting it back in its corner.
@Component({
    standalone: false,
    selector: "layout-ai-float",
    template: `
        @if (ai.available && ai.floating) {
            <nz-float-button class="ai-float hidden-mobile" nzType="primary"
                             [nzIcon]="ai.loading ? 'loading' : AI_ICON"
                             [attr.aria-label]="'ai.chat.title' | translate"
                             cdkDrag cdkDragBoundary="body" [cdkDragFreeDragPosition]="position"
                             (cdkDragStarted)="dragging = true" (cdkDragEnded)="dragEnd($event)"
                             (nzOnClick)="open()"
                             (contextmenu)="contextMenu($event, menu)"></nz-float-button>
            <nz-dropdown-menu #menu="nzDropdownMenu">
                <ul nz-menu>
                    <li nz-menu-item (click)="open()">{{ 'ai.entry.open' | translate }}</li>
                    <li nz-menu-item (click)="ai.openPage()">{{ 'ai.entry.page' | translate }}</li>
                    <li nz-menu-divider></li>
                    @if (moved) {
                        <li nz-menu-item (click)="resetPosition()">{{ 'ai.entry.reset' | translate }}</li>
                    }
                    <li nz-menu-item (click)="ai.setFloating(false)">{{ 'ai.entry.dock' | translate }}</li>
                </ul>
            </nz-dropdown-menu>
        }
    `
})
export class AiFloatComponent {

    // localStorage: the drag offset from the button's corner, as {x, y}
    private static readonly POSITION_KEY = "ai-float-position";

    // the corner the stylesheet puts the button in (erupt.component.less) and its size
    private static readonly CORNER_GAP = 30;
    private static readonly SIZE = 40;

    readonly AI_ICON = AI_ICON;

    position: Point = this.clamp(this.savedPosition());

    // true from drag start until just after the drop: the mouseup that ends a
    // drag also fires a click, which must not open the chat
    dragging = false;

    constructor(public ai: AiLauncherService,
                private contextMenuService: NzContextMenuService,
                @Inject(NzDrawerService) private drawer: NzDrawerService) {
    }

    get moved(): boolean {
        return this.position.x !== 0 || this.position.y !== 0;
    }

    open(): void {
        if (!this.dragging) {
            this.ai.openDrawer(this.drawer);
        }
    }

    contextMenu(event: MouseEvent, menu: NzDropdownMenuComponent): void {
        this.contextMenuService.create(event, menu);
    }

    dragEnd(event: CdkDragEnd): void {
        this.position = event.source.getFreeDragPosition();
        localStorage.setItem(AiFloatComponent.POSITION_KEY, JSON.stringify(this.position));
        setTimeout(() => this.dragging = false);
    }

    resetPosition(): void {
        this.position = {x: 0, y: 0};
        localStorage.removeItem(AiFloatComponent.POSITION_KEY);
    }

    // a smaller window must not leave the button outside it
    @HostListener("window:resize")
    onResize(): void {
        this.position = this.clamp(this.position);
    }

    private savedPosition(): Point {
        try {
            const {x, y} = JSON.parse(localStorage.getItem(AiFloatComponent.POSITION_KEY) || "{}");
            return {x: Number(x) || 0, y: Number(y) || 0};
        } catch {
            return {x: 0, y: 0};
        }
    }

    // The offset runs up and left from the corner, so it is never positive and
    // never larger than the room the window leaves
    private clamp(p: Point): Point {
        const room = (size: number) => Math.max(0, size - AiFloatComponent.SIZE - AiFloatComponent.CORNER_GAP);
        const x = Math.min(0, Math.max(p.x, -room(window.innerWidth)));
        const y = Math.min(0, Math.max(p.y, -room(window.innerHeight)));
        return x === p.x && y === p.y ? p : {x, y};
    }
}
