import {Component, EventEmitter, HostListener, OnInit, Output, ViewChild} from '@angular/core';
import {NzMessageService} from "ng-zorro-antd/message";
import {ProcessRenderComponent} from "./views/design/process/process-render.component";
import {NodeComponentConfigs, nodeType} from "./views/design/process/process-nodes";

@Component({
    selector: 'erupt-flow',
    templateUrl: './flow.component.html',
    styleUrls: ['./flow.component.less']
})
export class FlowComponent implements OnInit {

    active = true;

    modelValue: any[] = [{
        type: "Start",
        name: "str"
    }];

    @Output() modelValueChange = new EventEmitter<any[]>();

    @ViewChild('processRender', { static: false }) processRender!: ProcessRenderComponent;

    // 缩放比例
    zoom = 100;
    // 选中的节点
    activeNode: any = {};
    showInput = false;
    nodeConfVisible = false;
    // 是否按下ctrl
    private ctrlPressed = false;

    // 配置面板宽度
    get configWidth(): number {
        return this.activeNode.type === "Exclusive" ? 600 : 500;
    }

    constructor(private message: NzMessageService) {}

    ngOnInit() {
        // 加载的时候判断，赋默认值
        if (this.modelValue.length === 0) {
            this.modelValue = [nodeType.Start.create()];
            this.modelValueChange.emit(this.modelValue);
        }
    }

    ngOnDestroy() {
        // 清理事件监听器
        document.removeEventListener('keydown', this.keyDown.bind(this));
        document.removeEventListener('keyup', this.keyUp.bind(this));
        document.removeEventListener('wheel', this.mouseWheel.bind(this));
    }

    selectNode(node: any) {
        this.activeNode = node;
        if (NodeComponentConfigs[this.activeNode.type]) {
            this.nodeConfVisible = true;
        } else {
            this.message.warning('本节点无配置项');
        }
        console.log('选中', node);
    }

    doZoom(sc: number) {
        if ((this.zoom > 30 && this.zoom < 150)
            || (this.zoom <= 30 && sc > 0)
            || (this.zoom >= 150 && sc < 0)) {
            this.zoom += sc;
        } else {
            this.message.warning("缩放已经到极限了😥");
        }
    }

    @HostListener('document:keydown', ['$event'])
    keyDown(event: KeyboardEvent) {
        if (event.ctrlKey) {
            this.ctrlPressed = true;
            document.addEventListener('wheel', this.mouseWheel.bind(this), { passive: false });
        }
    }

    @HostListener('document:keyup', ['$event'])
    keyUp(event: KeyboardEvent) {
        if (event.key === "Control") {
            this.ctrlPressed = false;
            document.removeEventListener('wheel', this.mouseWheel.bind(this));
        }
    }

    mouseWheel(event: WheelEvent) {
        if (this.ctrlPressed && this.active) {
            // 阻止默认的缩放行为
            event.preventDefault();
            // 获取滚动方向，向上为正，向下为负
            const delta = Math.sign(event.deltaY);
            this.doZoom(delta * -5);
        }
    }

    validate() {
        return this.processRender.validate();
    }

}
