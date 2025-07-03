/**
 * 需要创建新的节点，统一在本ts内进行配置
 */
import {getRandNodeId} from '../../utils/process-util';

// 节点组件映射
export const NodeComponents: { [key: string]: any } = {
    Start: 'app-start-node',
    Approval: 'app-approval-node',
    Cc: 'app-cc-node',
    Exclusive: 'app-exclusive-node',
    Parallel: 'app-parallel-node',
    Gateway: 'app-gateway-node'
};

// 节点配置组件映射
export const NodeComponentConfigs: { [key: string]: any } = {
    Start: null,
    Approval: 'app-approval-config',
    Cc: 'app-cc-config',
    Exclusive: 'app-exclusive-config',
    Parallel: 'app-parallel-config',
    Gateway: 'app-gateway-config'
};

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
                childId: null,
                props: {
                    logic: true, // 组关系
                    groups: [ // 组条件
                        {
                            logic: true, // 组内条件关系
                            conditions: []
                        }
                    ]
                },
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
                props: {},
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
            childId: null,
            props: {
                mode: 'USER', // 审批方式：人工处理、自动通过、自动拒绝
                ruleType: 'ASSIGN_USER', // 规则类型，用哪种审批规则
                taskMode: { // 审批模式
                    type: 'AND',
                    percentage: 100,
                },
                needSign: false,
                assignUser: [], // 指定人员
                rootSelect: {
                    multiple: false, // 是否多选
                },
                leader: { // 部门负责人
                    level: 1,
                    emptySkip: false
                },
                leaderTop: {
                    level: 0, // 级数
                    toEnd: false, // 直到终点还是指定级别数
                    emptySkip: false
                },
                assignDept: {
                    dept: [], // 指定的部门
                    type: 'LEADER' // 部门主管
                },
                assignRole: [],
                noUserHandler: { // 无人时的处理规则
                    type: 'TO_NEXT',
                    assigned: []
                },
                sameRoot: {
                    type: 'TO_SELF',
                    assigned: []
                },
                timeout: { // 超时处理
                    enable: false,
                    time: 1,
                    timeUnit: 'M',
                    type: 'TO_PASS', // 自动通过
                }
            },
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
            props: {
                ruleType: 'ASSIGN_USER', // 规则类型，用哪种抄送规则
                assignUser: [], // 指定人员
                rootSelect: {
                    multiple: false, // 是否多选
                },
                assignDept: {
                    dept: [], // 指定的部门
                    type: 'LEADER' // 部门主管
                },
                assignRole: [],
            },
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
