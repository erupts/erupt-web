import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren} from '@angular/core';
import {NodeMap} from '@flow/node/process-nodes';
import {reloadNodeId} from '@flow/util/flow.util';
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../erupt/model/erupt-build.model";

@Component({
    selector: 'app-recursive-node',
    templateUrl: './recursive-node.component.html',
    styleUrls: ['./recursive-node.component.less']
})
export class RecursiveNodeComponent {
    @Input() readonly = false;
    @Input() node: NodeRule;
    @Input() branch: NodeRule[] = [];
    @Input() index = 0;

    @Input() eruptBuild: EruptBuildModel;

    @Output() nodeChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    @ViewChildren('startNode, approvalNode, flexNode, ccNode, exclusiveNode, parallelNode, branchNode, childNodeRef') nodeRefs!: QueryList<ElementRef>;

    nodeType = NodeType;

    /**
     * 插入节点
     * @param branch 该节点要插入的支路（节点数组）
     * @param i 插入哪个元素后面的索引，实际插入位置为i+1
     * @param type 要插入的节点类型
     */
    insertNodeFun(branch: any[], i: number, type: string) {
        const newNode = NodeMap[type].create();
        branch.splice(i + 1, 0, newNode);
    }

    /**
     * 删除某个元素
     * @param branch 要删除的元素所在支路
     * @param i 删除的元素在该支路内索引位置
     */
    deleteNode(branch: any[], i: number) {
        branch.splice(i, 1);
    }

    // 添加网关分支
    addBranch() {
        const index = this.node.branches.length - 1;
        const type = this.node.type;
        this.node.branches.splice(index, 0, NodeMap[type].createBranch(index + 1));
    }

    deepCopy(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }

    // 复制一个分支
    copyBranch(i: number) {
        // 复制条件
        const cd = this.deepCopy(this.node.branches[i]);
        cd.name = cd.name + '-copy';
        // 复制整个分支
        const bh = this.deepCopy(this.node.branches[i]);
        // 重载节点id
        reloadNodeId(cd);
        reloadNodeId(bh);
        // 插入到新位置
        // this.node.props.branch.splice(i + 1, 0, cd);
        this.node.branches.splice(i + 1, 0, bh);
    }

    // 删除网关分支
    deleteBranch(i: number) {
        if (this.node.branches.length <= 2) {
            // 只有两个分支，那么就直接删除整个网关
            this.delete.emit({
                branch: this.branch,
                index: this.index
            });
        } else {
            this.node.branches.splice(i, 1);
        }
    }

    // 左移分支
    moveL(i: number) {
        this.exchange(this.node.branches, i, i - 1);
    }

    // 右移分支
    moveR(i: number) {
        this.exchange(this.node.branches, i, i + 1);
    }

    // 交换数组俩元素位置
    exchange(arr: any[], si: number, ti: number) {
        const temp = arr[si];
        arr[si] = arr[ti];
        arr[ti] = temp;
    }

    selectFun(nd: any, i: number) {
        // if (!(i === this.node.branch.length - 1
        //     && this.node.props.type !== 'Parallel')) {
        //     // this.select.emit(nd);
        // }
    }

}
