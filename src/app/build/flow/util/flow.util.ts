import {NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

export function geneNodeId(): string {
    return 'e' + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}


export function reloadNodeId(node: any): void {
    if (node && typeof node === 'object') {
        if (node.id) {
            node.id = geneNodeId();
        }
        // 递归处理子节点
        if (node.branch && Array.isArray(node.branch)) {
            node.branch.forEach((child: any) => reloadNodeId(child));
        }
        if (node.props && node.props.branch && Array.isArray(node.props.branch)) {
            node.props.branch.forEach((child: any) => reloadNodeId(child));
        }
    }
}

export function insertFlexNodeFun(branch: any[], i: number, flex: FlexNodeModel) {
    branch.splice(i + 1, 0, {
        id: geneNodeId(),
        type: NodeType.FlEX,
        flex: flex.code,
        name: flex.name,
        color: flex.color
    });
}
