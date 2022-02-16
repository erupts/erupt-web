import {NzTreeNode} from "ng-zorro-antd/core/tree/nz-tree-base-node";

export function calcChecks(nodes: NzTreeNode[]): any[] {
    let arr = [];

    function putParents(node: NzTreeNode) {
        if (node.getParentNode()) {
            arr.push(node.getParentNode().key);
            putParents(node.parentNode);
        }
    }

    function putChildren(node: NzTreeNode) {
        if (node.getChildren() && node.getChildren().length > 0) {
            for (let child of node.getChildren()) {
                putChildren(child);
                arr.push(child.key);
            }
        }
    }

    for (let node of nodes) {
        arr.push(node.key);
        putParents(node);
        putChildren(node);
    }

    return arr;
}
