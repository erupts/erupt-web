/**
 * 需要创建新的节点，统一在本ts内进行配置
 */
import {ANode} from "@flow/node/abstract-node";
import {ApprovalNodeComponent} from "@flow/node/appoval/approval-node.component";
import {CcNodeComponent} from "@flow/node/cc/cc-node.component";
import {GatewayNodeComponent, GatewayType} from "@flow/node/gateway/gateway-node.component";
import {StartNodeComponent} from "@flow/node/start/start-node.component";
import {FlexNodeComponent} from "@flow/node/flex/flex-node.component";

export const Nodes: ANode[] = [
    (() => {
        const exclusiveNode = new GatewayNodeComponent();
        exclusiveNode.gatewayType = GatewayType.EXCLUSIVE;
        return exclusiveNode;
    })(),
    (() => {
        const parallelNode = new GatewayNodeComponent();
        parallelNode.gatewayType = GatewayType.PARALLEL;
        return parallelNode;
    })(),
    (() => {
        const parallelNode = new GatewayNodeComponent();
        parallelNode.gatewayType = GatewayType.INCLUSIVE;
        return parallelNode;
    })(),
    new StartNodeComponent(),
    new ApprovalNodeComponent(),
    new CcNodeComponent(),
    new FlexNodeComponent()
]

export const NodeMap: { [key: string]: ANode } = {}

for (let node of Nodes) {
    NodeMap[node.type()] = node;
}
