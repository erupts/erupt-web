/**
 * 需要创建新的节点，统一在本ts内进行配置
 */
import {ANode} from "@flow/nodes/abstract-node";
import {ApprovalNodeComponent} from "@flow/nodes/appoval/approval-node.component";
import {CcNodeComponent} from "@flow/nodes/cc/cc-node.component";
import {ExclusiveNodeComponent} from "@flow/nodes/exclusive/exclusive-node.component";
import {ParallelNodeComponent} from "@flow/nodes/parallel/parallel-node.component";
import {StartNodeComponent} from "@flow/nodes/start/start-node.component";

export const Nodes: ANode[] = [
    new StartNodeComponent(),
    new ApprovalNodeComponent(),
    new CcNodeComponent(),
    new ExclusiveNodeComponent(),
    new ParallelNodeComponent()
]

export const NodeMap:{ [key: string]: ANode } = {}

for (let node of Nodes) {
    NodeMap[node.code()] = node;
}
