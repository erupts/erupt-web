import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {BranchType, NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {EruptSearchModel} from "../../../erupt/model/erupt-search.model";
import {SmartSearchComponent} from "../../../erupt/components/smart-search/smart-search.component";
import {FlowTurn} from "@flow/model/flow-instance.model";
import {UpmsData} from "../../../erupt/model/upms.model";
import {UpmsDataService} from "@flow/service/upms-data.service";

export enum GatewayType {
    EXCLUSIVE = 'EXCLUSIVE',
    PARALLEL = 'PARALLEL',
    INCLUSIVE = 'INCLUSIVE'
}

export interface GatewayNode {
    type: BranchType
    conditions: EruptSearchModel[][]
}

@Component({
    selector: 'app-gateway-node',
    templateUrl: './gateway-node.component.html',
    styleUrls: ['./gateway-node.component.less']
})
export class GatewayNodeComponent extends ANode implements OnInit {

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

    @Input() gatewayNode: GatewayNode = {} as GatewayNode;

    @Input() progress: Record<string, FlowTurn>;

    @ViewChild(SmartSearchComponent, {static: false})
    smartSearchComponent!: SmartSearchComponent;

    upmsData: UpmsData;

    showErr = false;

    errInfo: any = null;

    showDrawer: boolean = false;

    constructor(private upmsDataService?: UpmsDataService) {
        super();
        this.upmsData = this.upmsDataService?.upmsData;
    }

    ngOnInit(): void {
        this.gatewayNode = this.modelValue.prop;
    }

    override onSelect() {
        if (!this.isDefault) {
            this.showDrawer = true;
        }
    }

    override onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    closeDrawer(): void {
        this.showDrawer = false;
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
                id: geneNodeId(),
                type: NodeType.GATEWAY_EXCLUSION,
                name: this.name(),
                branches: [
                    this.createBranch(1),
                    {
                        id: geneNodeId(),
                        type: NodeType.GATEWAY_BRANCH,
                        name: '默认条件',
                        prop: {
                            type: BranchType.ELSE,
                            conditions: []
                        },
                        branches: []
                    }
                ]
            }
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_PARALLEL,
                name: this.name(),
                branches: [
                    this.createBranch(1),
                    this.createBranch(2)
                ]
            }
        } else {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_INCLUSIVE,
                name: this.name(),
                branches: [
                    this.createBranch(1),
                    {
                        id: geneNodeId(),
                        type: NodeType.GATEWAY_BRANCH,
                        name: '默认条件（包容）',
                        prop: {
                            type: BranchType.ELSE,
                            conditions: []
                        },
                        branches: []
                    }
                ]
            }
        }
    }

    override onSaveProp(): void {
        if (this.smartSearchComponent.saveCondition()) {
            this.modelValue.prop = this.gatewayNode;
            this.showDrawer = false;
        }
    }

    override createBranch(i?: number): NodeRule {
        if (this.gatewayType === GatewayType.EXCLUSIVE) {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_BRANCH,
                name: '互斥条件' + i,
                prop: {
                    type: BranchType.CONDITION,
                    conditions: []
                } as GatewayNode,
                branches: []
            };
        } else if (this.gatewayType === GatewayType.PARALLEL) {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_BRANCH,
                name: '并行路径' + i,
                prop: {
                    type: BranchType.PARALLEL_CONDITION,
                    conditions: []
                } as GatewayNode,
                branches: []
            };
        } else {
            return {
                id: geneNodeId(),
                type: NodeType.GATEWAY_BRANCH,
                name: '包容条件' + i,
                prop: {
                    type: BranchType.CONDITION,
                    conditions: []
                } as GatewayNode,
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

    protected readonly GatewayType = GatewayType;
}
