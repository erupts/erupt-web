import {NzTreeNode} from "ng-zorro-antd/core/tree/nz-tree-base-node";

export function calcChecks(nodes: NzTreeNode[]): any[] {
    let set = new Set();

    function putParents(node: NzTreeNode) {
        if (node.getParentNode()) {
            set.add(node.getParentNode().key);
            putParents(node.parentNode);
        }
    }

    function putChildren(node: NzTreeNode) {
        if (node.getChildren() && node.getChildren().length > 0) {
            for (let child of node.getChildren()) {
                putChildren(child);
                set.add(child.key);
            }
        }
    }

    for (let node of nodes) {
        set.add(node.key);
        putParents(node);
        putChildren(node);
    }

    return Array.from(set);
}
