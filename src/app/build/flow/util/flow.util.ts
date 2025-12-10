import {NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

export function geneNodeId(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
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

export function getAvatarColor(avatar: string): string {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#fed6e3',
        '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'
    ];
    const index = avatar.charCodeAt(0) % colors.length;
    return colors[index];
}
