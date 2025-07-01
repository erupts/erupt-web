import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {NzMessageService} from "ng-zorro-antd/message";
import {ProcessRenderComponent} from "./views/process/process-render.component";
import {NodeComponentConfigs, nodeType} from "./views/process/process-nodes";
import Panzoom from "@panzoom/panzoom";

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

    @ViewChild('panzoomElement') panzoomElement: ElementRef;

    panzoom = null;

    // 选中的节点
    activeNode: any = {};

    nodeConfVisible = false;

    constructor(private message: NzMessageService) {
    }

    ngAfterViewInit(): void {
        this.panzoom = Panzoom(this.panzoomElement.nativeElement, {
            maxScale: 3,
            minScale: 0.5,
            contain: 'self',
            smoothScroll: true,
            cursor:"grab"
        });
    }

    ngOnInit() {
        // 加载的时候判断，赋默认值
        if (this.modelValue.length === 0) {
            this.modelValue = [nodeType.Start.create()];
            this.modelValueChange.emit(this.modelValue);
        }
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
        if (sc > 0) {
            this.panzoom.zoomIn();
        } else {
            this.panzoom.zoomOut();
        }
    }

    doHit(){
        this.panzoom.pan(0, 0);
        this.panzoom.zoom(1)
    }

    validate() {
        return this.processRender.validate();
    }

}
