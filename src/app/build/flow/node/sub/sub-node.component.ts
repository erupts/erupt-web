import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {FlowTurn} from "@flow/model/flow-instance.model";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowConfig} from "@flow/model/flow.model";
import {SubNode} from "@flow/model/flow-approval.model";

@Component({
    standalone: false,
    selector: 'app-sub-node',
    templateUrl: './sub-node.component.html',
    styleUrls: ['./sub-node.component.less']
})
export class SubNodeComponent extends ANode implements OnInit {

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() progress: Record<string, FlowTurn>;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    subNode: SubNode;

    flowConfigs: FlowConfig[] = [];

    subEruptBuild: EruptBuildModel;

    constructor(private flowApi?: FlowApiService) {
        super();
    }

    ngOnInit(): void {
        this.flowApi.configList().subscribe(res => {
            this.flowConfigs = res.data;
            if (this.modelValue.prop) {
                this.subNode = this.modelValue.prop;
                if (this.subNode.subFlowId) {
                    this.changeSubFlow(this.subNode.subFlowId, false);
                }
            } else {
                this.subNode = new SubNode();
            }
        })
    }

    color(): string {
        return "#5bc2f9";
    }

    create(): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
        }
    }

    name(): string {
        return "子流程";
    }

    onDelete(): void {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    onInsertFlexNode(flex: FlexNodeModel): void {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    onInsertNode(type: NodeType): void {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type,
            prop: new SubNode()
        });
    }

    onSaveProp(): void {
        this.modelValue.prop = this.subNode;
    }

    onSelect(): void {
        this.select.emit(this.modelValue);
    }

    type(): NodeType {
        return NodeType.SUB;
    }

    changeSubFlow(val: number, clearMapping: boolean = true) {
        let flowConfig = this.flowConfigs.find(config => config.id === val);
        if (clearMapping) {
            this.subNode.mappings = [{source: null, target: null}];
            this.subNode.mappingsReverse = [];
        }
        this.flowApi.eruptFlowBuild(flowConfig.erupt).subscribe(res => {
            this.subEruptBuild = res.data;
        })
    }

    addMapping() {
        this.subNode.mappings.push({source: null, target: null});
    }

    addMappingForParent() {
        this.subNode.mappingsReverse.push({source: null, target: null});
    }

}
