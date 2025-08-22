import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {BranchType, NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";

export enum GatewayType {
    EXCLUSIVE = 'EXCLUSIVE',
    PARALLEL = 'PARALLEL',
    INCLUSIVE = 'INCLUSIVE'
}

@Component({
    selector: 'app-gateway-node',
    templateUrl: './gateway-node.component.html',
    styleUrls: ['./gateway-node.component.less']
})
export class GatewayNodeComponent extends ANode {

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() moveLn = false;
    @Input() moveRn = false;
    @Input() isDefault = false;
    @Input() gatewayType: GatewayType = GatewayType.EXCLUSIVE;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

    showErr = false;
    errInfo: any = null;

    override onSelect() {
        this.select.emit(this.modelValue);
    }

    override onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    override onInsertNode(type: NodeType) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, -1, flex);
    }

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    override type(): NodeType {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return NodeType.GATEWAY_EXCLUSION;
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return NodeType.GATEWAY_PARALLEL;
        } else {
            return NodeType.GATEWAY_INCLUSIVE;
        }
    }

    override color(): string {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return "#59B9A4";
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return "#718dff";
        } else {
            return "#FF9800"; // 包容节点使用橙色
        }
    }

    override name(): string {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return "互斥分支";
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return "并行分支";
        } else {
            return "包容分支";
        }
    }

    override create(): NodeRule {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return {
                id: geneNodeId() + '_fork',
                type: NodeType.GATEWAY_EXCLUSION,
                name: this.name(),
                branches: [
                    this.createBranch(1),
                    {
                        id: geneNodeId(),
                        type: NodeType.GATEWAY_BRANCH,
                        name: '默认条件',
                        prop: {
                            type: BranchType.ELSE
                        },
                        branches: []
                    }
                ]
            }
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return {
                id: geneNodeId() + '_fork',
                type: NodeType.GATEWAY_PARALLEL,
                name: this.name(),
                branches: [
                    this.createBranch(1),
                    this.createBranch(2)
                ]
            }
        } else {
            return {
                id: geneNodeId() + '_fork',
                type: NodeType.GATEWAY_INCLUSIVE,
                name: this.name(),
                branches: [
                    this.createBranch(1),
                    {
                        id: geneNodeId(),
                        type: NodeType.GATEWAY_BRANCH,
                        name: '默认条件',
                        prop: {
                            type: BranchType.ELSE
                        },
                        branches: []
                    }
                ]
            }
        }
    }

    override onSaveProp(): void {
    }

    override createBranch(i?: number): NodeRule {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_BRANCH,
                name: '互斥条件' + i,
                prop: {
                    type: BranchType.CONDITION
                },
                branches: []
            };
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_BRANCH,
                name: '并行路径' + i,
                prop: {
                    type: BranchType.CONDITION
                },
                branches: []
            };
        } else {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_BRANCH,
                name: '包容条件' + i,
                prop: {
                    type: BranchType.CONDITION
                },
                branches: []
            };
        }
    }

    getHeaderIcon(): string {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return "share";
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return "apartment";
        } else {
            return "fork"; // 包容节点使用fork图标
        }
    }

    getDescription(): string {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return '优先级 ' + (this.index + 1);
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return '并行执行';
        } else {
            return '包容执行';
        }
    }

    getContent(): string {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return '';
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return '并行流程分支';
        } else {
            return '包容流程分支';
        }
    }
}
