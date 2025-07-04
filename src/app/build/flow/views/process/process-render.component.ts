import {Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren} from '@angular/core';
import {NodeComponents, nodeType} from './process-nodes';

@Component({
    selector: 'app-process-render',
    templateUrl: './process-render.component.html',
    styleUrls: ['./process-render.component.less']
})
export class ProcessRenderComponent implements OnInit {

    @Input() readonly = false;

    @Input() modelValue: any[];

    @Output() modelValueChange = new EventEmitter<any[]>();

    @Output() select = new EventEmitter<any>();

    @ViewChildren('node') nodeRefs!: QueryList<ElementRef>;

    NodeComponents = NodeComponents;

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
        if (nodeType[type] && nodeType[type].create) {
            const newNode = nodeType[type].create();
            branch.splice(i + 1, 0, newNode);
        } else {
            // this.message.warning('请在ProcessNodes.ts内配置该节点');
        }
    }

    validate() {
        return new Promise((resolve, reject) => {
            const errs: any[] = [];
            if (this.nodeRefs) {
                this.nodeRefs.forEach(ref => {
                    const component = ref.nativeElement.__ngContext__;
                    if (component && component.validate) {
                        component.validate(errs);
                    }
                });
            }
            if (errs.length === 0) {
                resolve(true);
            } else {
                reject(errs);
            }
        });
    }
}
