import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnInit,
    Output,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {NzMessageService} from "ng-zorro-antd/message";
import {StartNodeComponent} from "@flow/node/start/start-node.component";
import {NodeRule} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {EndNodeComponent} from "@flow/node/end/end-node.component";
import {FlowTurn} from "@flow/model/flow-instance.model";

@Component({
    standalone: false,
    selector: 'erupt-flow',
    templateUrl: './erupt-flow.component.html',
    styleUrls: ['./erupt-flow.component.less']
})
export class EruptFlowComponent implements OnInit, AfterViewInit {

    @Input() modelValue: NodeRule[] = [];

    @Input() eruptBuild: EruptBuildModel;

    @Input() readonly = false;

    @Output() modelValueChange = new EventEmitter<NodeRule[]>();

    @Output() select = new EventEmitter<any>();

    @Input() progress: Record<string, FlowTurn>

    isFullscreen = false;

    showGrid = true;

    @ViewChild('canvasContainer') canvasContainer: ElementRef;

    @ViewChildren('node') nodeRefs!: QueryList<ElementRef>;

    // Drag-related properties
    isDragging = false;
    startX = 0;
    startY = 0;
    startScrollLeft = 0;
    startScrollTop = 0;

    // Zoom-related properties
    scale = 1;
    minScale = 0.1;
    maxScale = 3;
    scaleStep = 0.1;

    // Detect zoom support
    private zoomSupported = this.checkZoomSupport();

    constructor(private message: NzMessageService) {
    }

    /**
     * Detect whether the browser supports the zoom property
     */
    private checkZoomSupport(): boolean {
        const testElement = document.createElement('div');
        (testElement.style as any).zoom = '1.1';
        return (testElement.style as any).zoom === '1.1';
    }

    ngAfterViewInit(): void {
        this.initCanvasDrag();
    }

    ngOnInit() {
        // Check on load and assign default values
        if (!this.modelValue) {
            this.modelValue = [new StartNodeComponent().create(), new EndNodeComponent().create()];
            this.modelValueChange.emit(this.modelValue);
        }
    }

    /**
     * Initialize canvas drag functionality
     */
    private initCanvasDrag() {
        if (this.canvasContainer) {
            const container = this.canvasContainer.nativeElement;
            container.style.cursor = 'grab';
            container.style.userSelect = 'none';
        }
    }

    /**
     * Get the nearest scrollable parent container
     */
    private getScrollableContainer(): HTMLElement | null {
        if (!this.canvasContainer) return null;

        // Find the nearest parent container that has scrollbars
        let element = this.canvasContainer.nativeElement.parentElement;
        while (element) {
            const style = window.getComputedStyle(element);
            if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return element;
            }
            element = element.parentElement;
        }

        // If none found, return the flow container itself
        return this.canvasContainer.nativeElement.closest('.flow');
    }

    /**
     * Get the DOM element of the ProcessRender component
     */
    private getProcessRenderElement(): HTMLElement | null {
        if (!this.canvasContainer) return null;

        return this.canvasContainer.nativeElement.querySelector('.process');
    }

    /**
     * Apply zoom scale
     */
    private applyScale() {
        const processRenderElement = this.getProcessRenderElement();
        if (processRenderElement) {
            if (this.zoomSupported) {
                // Use the zoom property
                (processRenderElement.style as any).zoom = this.scale.toString();
                // Remove transform-related styles
                processRenderElement.style.transform = '';
                processRenderElement.style.transformOrigin = '';
            } else {
                // Fall back to transform scale
                processRenderElement.style.transform = `scale(${this.scale})`;
                processRenderElement.style.transformOrigin = 'center center';

                // Remove zoom-related styles
                (processRenderElement.style as any).zoom = '';
            }
        }
    }

    /**
     * Mouse down event
     */
    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        // Check whether the click is on the canvas container
        const target = event.target as HTMLElement;
        const container = this.canvasContainer?.nativeElement;

        if (container && (target === container || container.contains(target))) {
            // Check whether the click is on a specific interactive element; if so, do not initiate dragging
            const isInteractiveElement = target.closest('button, input, select, textarea, [contenteditable], .node-input, .node-edit, .node-delete, .insert-btn');

            // If the click is on an interactive element and not the middle button, do not initiate dragging
            if (isInteractiveElement && event.button !== 1) {
                return;
            }

            // Support left-button drag (on non-interactive elements) and middle-button drag (anywhere)
            if (event.button === 0 || event.button === 1) {
                this.isDragging = true;
                this.startX = event.clientX;
                this.startY = event.clientY;

                // Get the current scroll position
                const scrollContainer = this.getScrollableContainer();
                if (scrollContainer) {
                    this.startScrollLeft = scrollContainer.scrollLeft;
                    this.startScrollTop = scrollContainer.scrollTop;
                }
                container.style.cursor = 'grabbing';
                if (event.button === 1) {
                    event.preventDefault(); // Prevent middle-button click from triggering scroll
                }
            }
        }
    }

    /**
     * Mouse wheel event - implements zoom
     */
    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent) {
        // If the Ctrl key is held, perform zoom
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -1 : 1;
            this.doZoom(delta);
        }
    }

    /**
     * Keyboard event
     */
    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        // Do not trigger shortcuts while typing
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        if (event.ctrlKey || event.metaKey) {
            if (event.key === '=' || event.key === '+') {
                event.preventDefault();
                this.doZoom(1);
            } else if (event.key === '-') {
                event.preventDefault();
                this.doZoom(-1);
            } else if (event.key === '0') {
                event.preventDefault();
                this.doHit();
            } else if (event.key === 's' || event.key === 'S') {
                // Block save shortcut interference, or bind to export
                // event.preventDefault();
            } else if (event.key === 'g' || event.key === 'G') {
                event.preventDefault();
                this.showGrid = !this.showGrid;
            }
        }
    }

    /**
     * Mouse move event
     */
    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            const deltaX = this.startX - event.clientX;
            const deltaY = this.startY - event.clientY;

            // Update scroll position
            const scrollContainer = this.getScrollableContainer();
            if (scrollContainer) {
                scrollContainer.scrollLeft = this.startScrollLeft + deltaX;
                scrollContainer.scrollTop = this.startScrollTop + deltaY;
            }

            event.preventDefault();
        }
    }

    /**
     * Mouse up event
     */
    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (this.isDragging) {
            this.isDragging = false;

            const container = this.canvasContainer.nativeElement;
            container.style.cursor = 'grab';
        }
    }

    /**
     * Mouse leave event
     */
    @HostListener('mouseleave', ['$event'])
    onMouseLeave(event: MouseEvent) {
        if (this.isDragging) {
            this.isDragging = false;

            const container = this.canvasContainer.nativeElement;
            container.style.cursor = 'grab';
        }
    }

    selectNode(node: any) {
        this.select.emit(node);
    }

    /**
     * Zoom function
     */
    doZoom(sc: number) {
        if (sc > 0) {
            // Zoom in
            this.scale = Math.min(this.maxScale, this.scale + this.scaleStep);
        } else {
            // Zoom out
            this.scale = Math.max(this.minScale, this.scale - this.scaleStep);
        }

        this.applyScale();
    }

    /**
     * Reset and fit the view
     */
    doHit() {
        const scrollContainer = this.getScrollableContainer();
        const processRenderElement = this.getProcessRenderElement();

        if (scrollContainer && processRenderElement) {
            const containerWidth = scrollContainer.clientWidth - 80; // Reserve 40px padding
            const containerHeight = scrollContainer.clientHeight - 80;
            const contentWidth = processRenderElement.offsetWidth;
            const contentHeight = processRenderElement.offsetHeight;

            // Calculate the scale ratio to fit the container
            const scaleX = containerWidth / contentWidth;
            const scaleY = containerHeight / contentHeight;
            let newScale = Math.min(scaleX, scaleY);

            // Clamp the scale to a reasonable range and do not exceed 1
            newScale = Math.max(this.minScale, Math.min(1, newScale));

            this.scale = newScale;
            this.applyScale();

            // Reset scroll position and center
            setTimeout(() => {
                const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                scrollContainer.scrollLeft = maxScrollLeft > 0 ? maxScrollLeft / 2 : 0;
                scrollContainer.scrollTop = 0;
            }, 0);
        } else {
            // Fall back to a basic reset
            this.scale = 1;
            this.applyScale();
        }
    }

    /**
     * Toggle fullscreen state
     */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        // After toggling fullscreen, fit the view
        setTimeout(() => this.doHit(), 300);
    }

    /**
     * Reset zoom
     */
    resetZoom() {
        this.scale = 1;
        this.applyScale();
    }

    protected readonly FlowTurn = FlowTurn;

}
