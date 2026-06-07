import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NodeMap} from '@flow/node/process-nodes';
import {geneNodeId, insertFlexNodeFun, reloadNodeId} from '@flow/util/flow.util';
import {BranchType, NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {GatewayType} from "@flow/node/gateway/gateway-node.component";
import {FlowTurn} from "@flow/model/flow-instance.model";

@Component({
    standalone: false,
    selector: 'app-recursive-node',
    templateUrl: './recursive-node.component.html',
    styleUrls: ['./recursive-node.component.less']
})
export class RecursiveNodeComponent {

    @Input() flowRule: NodeRule[];
    @Input() readonly = false;
    @Input() node: NodeRule;
    @Input() branch: NodeRule[] = [];
    @Input() index = 0;

    @Input() progress: Record<string, FlowTurn>;

    @Input() eruptBuild: EruptBuildModel;

    @Output() nodeChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();


    nodeType = NodeType;
    gatewayType = GatewayType;

    /**
     * Insert a node
     * @param branch The branch (node array) into which the node will be inserted
     * @param i The index after which the node is inserted; the actual insertion position is i+1
     * @param type The type of node to insert
     */
    insertNodeFun(branch: any[], i: number, type: NodeType) {
        const newNode = NodeMap[type].create();
        branch.splice(i + 1, 0, newNode);
        if (newNode.type === NodeType.GATEWAY_PARALLEL || newNode.type === NodeType.GATEWAY_INCLUSIVE) {
            branch.splice(i + 2, 0, {
                id: geneNodeId(),
                type: NodeType.GATEWAY_JOIN,
                name: newNode.type + "_JOIN",
            });
        }
    }

    onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    /**
     * Delete an element
     * @param branch The branch containing the element to delete
     * @param i The index of the element within that branch
     */
    deleteNode(branch: any[], i: number) {
        console.log(branch[i].type)
        if (branch[i].type === NodeType.GATEWAY_PARALLEL || branch[i].type === NodeType.GATEWAY_INCLUSIVE) {
            branch.splice(i, 2);
        } else {
            branch.splice(i, 1);
        }
    }

    // Add a gateway branch
    addBranch() {
        let hasElse: boolean = false;
        for (let branch of this.node.branches) {
            if (branch.prop?.type === BranchType.ELSE) {
                hasElse = true;
            }
        }
        const index = this.node.branches.length - (hasElse ? 1 : 0);
        const type = this.node.type;
        this.node.branches.splice(index, 0, NodeMap[type].createBranch(index));
    }

    deepCopy(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Copy a branch
    copyBranch(i: number) {
        // Copy the condition
        const cd = this.deepCopy(this.node.branches[i]);
        cd.name = cd.name + '-copy';
        // Copy the entire branch
        const bh = this.deepCopy(this.node.branches[i]);
        // Reload node IDs
        reloadNodeId(cd);
        reloadNodeId(bh);
        // Insert at new position
        // this.node.props.branch.splice(i + 1, 0, cd);
        this.node.branches.splice(i + 1, 0, bh);
    }

    // Delete a gateway branch
    deleteBranch(i: number) {
        if (this.node.branches.length <= 2) {
            this.deleteNode(this.branch, this.index);
        } else {
            this.node.branches.splice(i, 1);
        }
    }

    // Move branch left
    moveL(i: number) {
        this.exchange(this.node.branches, i, i - 1);
    }

    // Move branch right
    moveR(i: number) {
        this.exchange(this.node.branches, i, i + 1);
    }

    // Swap the positions of two elements in an array
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

    protected readonly BranchType = BranchType;
}
