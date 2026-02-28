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

    // 检测zoom支持
    private zoomSupported = this.checkZoomSupport();

    constructor(private message: NzMessageService) {
    }

    /**
     * 检测浏览器是否支持zoom属性
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
        // 加载的时候判断，赋默认值
        if (!this.modelValue) {
            this.modelValue = [new StartNodeComponent().create(), new EndNodeComponent().create()];
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
        if (!this.canvasContainer) return null;

        return this.canvasContainer.nativeElement.querySelector('.process');
    }

    /**
     * 应用缩放
     */
    private applyScale() {
        const processRenderElement = this.getProcessRenderElement();
        if (processRenderElement) {
            if (this.zoomSupported) {
                // 使用zoom属性
                (processRenderElement.style as any).zoom = this.scale.toString();
                // 移除transform相关样式
                processRenderElement.style.transform = '';
                processRenderElement.style.transformOrigin = '';
            } else {
                // 回退到transform scale
                processRenderElement.style.transform = `scale(${this.scale})`;
                processRenderElement.style.transformOrigin = 'center center';

                // 移除zoom相关样式
                (processRenderElement.style as any).zoom = '';
            }
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
            // 检查是否点击在特定的交互元素上，如果是则不启动拖拽
            const isInteractiveElement = target.closest('button, input, select, textarea, [contenteditable], .node-input, .node-edit, .node-delete, .insert-btn');

            // 如果点击在交互元素上，且不是中键，不启动拖拽
            if (isInteractiveElement && event.button !== 1) {
                return;
            }

            // 支持左键拖拽（在非交互元素上）和中键拖拽（任何地方）
            if (event.button === 0 || event.button === 1) {
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
                if (event.button === 1) {
                    event.preventDefault(); // 防止中键点击触发滚动
                }
            }
        }
    }

    /**
     * 鼠标滚轮事件 - 实现缩放
     */
    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent) {
        // 如果按住 Ctrl 键，则进行缩放
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -1 : 1;
            this.doZoom(delta);
        }
    }

    /**
     * 键盘事件
     */
    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        // 如果正在输入，不触发快捷键
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
                // 屏蔽保存快捷键干扰，或者可以绑定为导出
                // event.preventDefault();
            } else if (event.key === 'g' || event.key === 'G') {
                event.preventDefault();
                this.showGrid = !this.showGrid;
            }
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

    selectNode(node: any) {
        this.select.emit(node);
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
     * 重置并自适应视图
     */
    doHit() {
        const scrollContainer = this.getScrollableContainer();
        const processRenderElement = this.getProcessRenderElement();

        if (scrollContainer && processRenderElement) {
            const containerWidth = scrollContainer.clientWidth - 80; // 留出 40px padding
            const containerHeight = scrollContainer.clientHeight - 80;
            const contentWidth = processRenderElement.offsetWidth;
            const contentHeight = processRenderElement.offsetHeight;

            // 计算缩放比例以适应容器
            const scaleX = containerWidth / contentWidth;
            const scaleY = containerHeight / contentHeight;
            let newScale = Math.min(scaleX, scaleY);

            // 限制缩放比例在合理范围内，且不要超过 1
            newScale = Math.max(this.minScale, Math.min(1, newScale));

            this.scale = newScale;
            this.applyScale();

            // 重置滚动位置并居中
            setTimeout(() => {
                const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                scrollContainer.scrollLeft = maxScrollLeft > 0 ? maxScrollLeft / 2 : 0;
                scrollContainer.scrollTop = 0;
            }, 0);
        } else {
            // 回退到基本重置
            this.scale = 1;
            this.applyScale();
        }
    }

    /**
     * 切换全屏状态
     */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        // 全屏切换后，自适应一下视图
        setTimeout(() => this.doHit(), 300);
    }

    /**
     * 重置缩放
     */
    resetZoom() {
        this.scale = 1;
        this.applyScale();
    }

    protected readonly FlowTurn = FlowTurn;

}
