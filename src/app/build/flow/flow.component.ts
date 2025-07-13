import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {NzMessageService} from "ng-zorro-antd/message";
import {ProcessRenderComponent} from "./components/process-render.component";
import {nodeType} from "./nodes/process-nodes";

@Component({
    selector: 'erupt-flow',
    templateUrl: './flow.component.html',
    styleUrls: ['./flow.component.less']
})
export class FlowComponent implements OnInit, AfterViewInit {

    active = true;

    modelValue: any[] = [{
        type: "Start",
        name: "str"
    }];

    @Output() modelValueChange = new EventEmitter<any[]>();

    @ViewChild('processRender', {static: false}) processRender!: ProcessRenderComponent;

    @ViewChild('canvasContainer') canvasContainer: ElementRef;

    // 选中的节点
    activeNode: any = {};

    nodeConfVisible = false;

    // 拖拽相关属性
    isDragging = false;
    startX = 0;
    startY = 0;
    startScrollLeft = 0;
    startScrollTop = 0;

    // 缩放相关属性
    scale = 1;
    minScale = 0.1;
    maxScale = 3;
    scaleStep = 0.1;

    constructor(private message: NzMessageService) {
    }

    ngAfterViewInit(): void {
        this.initCanvasDrag();
    }

    ngOnInit() {
        // 加载的时候判断，赋默认值
        if (this.modelValue.length === 0) {
            this.modelValue = [nodeType['Start'].create()];
            this.modelValueChange.emit(this.modelValue);
        }
    }

    /**
     * 初始化画布拖拽功能
     */
    private initCanvasDrag() {
        if (this.canvasContainer) {
            const container = this.canvasContainer.nativeElement;
            container.style.cursor = 'grab';
            container.style.userSelect = 'none';
        }
    }

    /**
     * 获取可滚动的父容器
     */
    private getScrollableContainer(): HTMLElement | null {
        if (!this.canvasContainer) return null;

        // 查找最近的具有滚动条的父容器
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

        // 如果没有找到，返回flow容器本身
        return this.canvasContainer.nativeElement.closest('.flow');
    }

    /**
     * 获取ProcessRender组件的DOM元素
     */
    private getProcessRenderElement(): HTMLElement | null {
        if (!this.processRender) return null;

        return (this.processRender as any).elementRef?.nativeElement ||
            (this.processRender as any).el?.nativeElement ||
            this.canvasContainer.nativeElement.querySelector('app-process-render');
    }

    /**
     * 应用缩放
     */
    private applyScale() {
        const processRenderElement = this.getProcessRenderElement();
        if (processRenderElement) {
            processRenderElement.style.transform = `scale(${this.scale})`;
            processRenderElement.style.transformOrigin = 'center center';
        }
    }

    /**
     * 鼠标按下事件
     */
    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        // 检查是否在画布容器上点击
        const target = event.target as HTMLElement;
        const container = this.canvasContainer?.nativeElement;

        if (container && (target === container || container.contains(target))) {
            // 检查是否点击在节点上，如果是则不启动拖拽
            if (target.closest('.process-node') || target.closest('app-recursive-node')) {
                return;
            }

            this.isDragging = true;
            this.startX = event.clientX;
            this.startY = event.clientY;

            // 获取当前滚动位置
            const scrollContainer = this.getScrollableContainer();
            if (scrollContainer) {
                this.startScrollLeft = scrollContainer.scrollLeft;
                this.startScrollTop = scrollContainer.scrollTop;
            }

            container.style.cursor = 'grabbing';

            event.preventDefault();
        }
    }

    /**
     * 鼠标移动事件
     */
    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            const deltaX = this.startX - event.clientX;
            const deltaY = this.startY - event.clientY;

            // 更新滚动位置
            const scrollContainer = this.getScrollableContainer();
            if (scrollContainer) {
                scrollContainer.scrollLeft = this.startScrollLeft + deltaX;
                scrollContainer.scrollTop = this.startScrollTop + deltaY;
            }

            event.preventDefault();
        }
    }

    /**
     * 鼠标释放事件
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
     * 鼠标离开事件
     */
    @HostListener('mouseleave', ['$event'])
    onMouseLeave(event: MouseEvent) {
        if (this.isDragging) {
            this.isDragging = false;

            const container = this.canvasContainer.nativeElement;
            container.style.cursor = 'grab';
        }
    }

    /**
     * 鼠标滚轮事件 - 缩放功能
     */
    // @HostListener('wheel', ['$event'])
    // onWheel(event: WheelEvent) {
    //     // 检查是否在画布容器上
    //     const target = event.target as HTMLElement;
    //     const container = this.canvasContainer?.nativeElement;
    //
    //     if (container && (target === container || container.contains(target))) {
    //         event.preventDefault();
    //
    //         // 根据滚轮方向决定缩放方向
    //         const delta = event.deltaY > 0 ? -1 : 1;
    //         this.doZoom(delta);
    //     }
    // }

    selectNode(node: any) {
        this.activeNode = node;
        // if (NodeComponentConfigs[this.activeNode.type]) {
        //     this.nodeConfVisible = true;
        // }
    }

    /**
     * 缩放功能
     */
    doZoom(sc: number) {
        if (sc > 0) {
            // 放大
            this.scale = Math.min(this.maxScale, this.scale + this.scaleStep);
        } else {
            // 缩小
            this.scale = Math.max(this.minScale, this.scale - this.scaleStep);
        }

        this.applyScale();
    }

    /**
     * 重置功能
     */
    doHit() {
        // 重置缩放比例
        this.scale = 1;
        this.applyScale();

        // 重置滚动位置到顶部
        const scrollContainer = this.getScrollableContainer();
        if (scrollContainer) {
            scrollContainer.scrollLeft = 0;
            scrollContainer.scrollTop = 0;
        }

        this.message.info('已重置到默认视图');
    }

    validate() {
        return this.processRender.validate();
    }

}
