import {NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {InstanceStatus, TaskStatus} from "@flow/model/flow-instance.model";

export function geneNodeId(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}


export function reloadNodeId(node: any): void {
    if (node && typeof node === 'object') {
        if (node.id) {
            node.id = geneNodeId();
        }
        // Recursively process child nodes
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

/**
 * nz-tag color for an approval status — shared by the instance list, the detail hero and
 * the task records table. InstanceStatus and TaskStatus overlap on PENDING / REJECTED, so
 * one switch covers both; anything left over keeps the default gray tag.
 */
export function getStatusColor(status: InstanceStatus | TaskStatus): string {
    switch (status) {
        case InstanceStatus.PENDING: // also TaskStatus.PENDING
            return 'processing';
        case InstanceStatus.FINISH:
        case TaskStatus.AGREED:
            return 'success';
        case InstanceStatus.REJECTED: // also TaskStatus.REJECTED
        case InstanceStatus.TERMINATED:
            return 'error';
        case InstanceStatus.WITHDRAWN:
            return 'warning';
        default:
            return null;
    }
}
