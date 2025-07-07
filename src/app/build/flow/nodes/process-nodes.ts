/**
 * 需要创建新的节点，统一在本ts内进行配置
 */
import {getRandNodeId} from '../utils/process-util';
import {ANode} from "@flow/nodes/abstract-node";
import {ApprovalNodeComponent} from "@flow/nodes/appoval/approval-node.component";
import {CcNodeComponent} from "@flow/nodes/cc/cc-node.component";
import {ExclusiveNodeComponent} from "@flow/nodes/exclusive/exclusive-node.component";
import {ParallelNodeComponent} from "@flow/nodes/parallel/parallel-node.component";
import {StartNodeComponent} from "@flow/nodes/start/start-node.component";

export const nodes: ANode[] = [
    new StartNodeComponent(),
    new ApprovalNodeComponent(),
    new CcNodeComponent(),
    new ExclusiveNodeComponent(),
    new ParallelNodeComponent()
]

export const nodeMapping = (): { [key: string]: ANode } => {
    const result: { [key: string]: ANode } = {};
    for (let node of nodes) {
        result[node.code()] = node;
    }
    return result;
};

// export const nodes: { [key: string]: ANode } = {}

const createGateway = (type: string) => {
    return {
        id: getRandNodeId() + '_fork',
        type: 'Gateway',
        name: '网关节点',
        parentId: null,
        childId: null,
        props: {
            type: type,
            branch: [
                // 默认创建俩分支
                branchNode[type].createSelf(1),
                branchNode[type].createSelf()
            ]
        },
        branch: [[], []] // 默认要创建2个空分支
    };
};

// 定义分支子节点
const branchNode: { [key: string]: any } = {
    Exclusive: {
        name: '互斥条件',
        icon: 'Share',
        color: '#1BB782',
        // 创建自身
        createSelf(i?: number) {
            return {
                id: getRandNodeId(),
                type: 'Exclusive',
                name: i ? '条件' + i : '默认条件',
                parentId: null,
                childId: null
            };
        },
        create() {
            return createGateway('Exclusive');
        }
    },
    Parallel: {
        name: '并行分支',
        icon: 'Operation',
        color: '#718dff',
        // 创建自身
        createSelf(i?: number) {
            return {
                id: getRandNodeId(),
                type: 'Parallel',
                name: '并行路径' + (i ? i : 2),
                parentId: null,
                childId: null,
            };
        },
        create() {
            return createGateway('Parallel');
        }
    },
};

// 开始节点
const Start = {
    create() {
        return {
            id: 'node_root',
            type: 'Start',
            name: '发起人',
            parentId: null,
            childId: null,
            props: {},
        };
    }
};

// 审批节点
const Approval = {
    name: '审批人',
    icon: 'Stamp',
    color: '#EF994F',
    create() {
        return {
            id: getRandNodeId(),
            type: 'Approval',
            name: '审批人',
            parentId: null,
            childId: null
        };
    }
};

// 抄送节点
const Cc = {
    name: '抄送人',
    icon: 'Promotion',
    color: '#5994F3',
    create() {
        return {
            id: getRandNodeId(),
            type: 'Cc',
            name: '抄送人',
            parentId: null,
            childId: null,
        };
    }
};

export const nodeType: { [key: string]: any } = {
    Start: Start,
    Approval: Approval,
    Cc: Cc,
    // 注入分支节点定义
    ...branchNode,
};
