/**
 * 需要创建新的节点，统一在本ts内进行配置
 */
import {ANode} from "@flow/node/abstract-node";
import {ApprovalNodeComponent} from "@flow/node/appoval/approval-node.component";
import {CcNodeComponent} from "@flow/node/cc/cc-node.component";
import {ExclusiveNodeComponent} from "@flow/node/exclusive/exclusive-node.component";
import {ParallelNodeComponent} from "@flow/node/parallel/parallel-node.component";
import {StartNodeComponent} from "@flow/node/start/start-node.component";
import {FlexNodeComponent} from "@flow/node/flex/flex-node.component";

export const Nodes: ANode[] = [
    new StartNodeComponent(),
    new ApprovalNodeComponent(),
    new CcNodeComponent(),
    new ExclusiveNodeComponent(),
    new ParallelNodeComponent(),
    new FlexNodeComponent()
]

export const NodeMap:{ [key: string]: ANode } = {}

for (let node of Nodes) {
    NodeMap[node.type()] = node;
}
