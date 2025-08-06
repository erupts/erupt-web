import {Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren} from '@angular/core';
import {NodeMap} from '@flow/node/process-nodes';
import {NodeRule} from "@flow/model/node.model";

@Component({
    selector: 'app-process-render',
    templateUrl: './process-render.component.html',
    styleUrls: ['./process-render.component.less']
})
export class ProcessRenderComponent implements OnInit {

    @Input() readonly = false;

    @Input() modelValue: NodeRule[];

    @Output() modelValueChange = new EventEmitter<any[]>();

    @Output() select = new EventEmitter<any>();

    @ViewChildren('node') nodeRefs!: QueryList<ElementRef>;


    ngOnInit(): void {

    }

    /**
     * 删除某个元素
     * @param branch 要删除的元素所在支路
     * @param i 删除的元素在该支路内索引位置
     */
    deleteNode(branch: any[], i: number) {
        branch.splice(i, 1);
    }

    /**
     * 插入节点
     * @param branch 该节点要插入的支路（节点数组）
     * @param i 插入哪个元素后面的索引，实际插入位置为i+1
     * @param type 要插入的节点类型
     */
    insertNode(branch: any[], i: number, type: string) {
        if (NodeMap[type] && NodeMap[type].create) {
            const newNode = NodeMap[type].create();
            branch.splice(i + 1, 0, newNode);
        }
    }

}
