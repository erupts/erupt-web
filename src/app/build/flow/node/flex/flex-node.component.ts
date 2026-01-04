import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NodeRule, NodeType} from "@flow/model/node.model";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {ANode} from "@flow/node/abstract-node";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowDataService} from "@flow/service/flow-data.service";
import {FormSize} from "../../../erupt/model/erupt.enum";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";
import {FlowTurn} from "@flow/model/flow-instance.model";

@Component({
    standalone: false,
    selector: 'erupt-flex-node',
    templateUrl: './flex-node.component.html',
    styleUrls: ['./flex-node.component.less']
})
export class FlexNodeComponent extends ANode implements OnInit {

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    @Input() progress: Record<string, FlowTurn>;

    flexErupt: EruptBuildModel;

    constructor(private flowApiService?: FlowApiService,
                private flowDataService?: FlowDataService,
                private dataHandlerService?: DataHandlerService
    ) {
        super();
    }

    ngOnInit(): void {

    }

    override onInsertNode(type: NodeType) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    override color(): string {
        if (this.modelValue?.flex) {
            for (let flexNode of this.flowDataService.flexNodes) {
                if (flexNode.code === this.modelValue.flex) {
                    return flexNode.color;
                }
            }
        }
        return "#000";
    }

    override create(flex?: FlexNodeModel): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            flex: flex.code,
            name: flex.name,
        };
    }

    override onSelect() {
        if (this.modelValue?.flex) {
            this.flowApiService.flexEruptFlowBuild(this.modelValue.flex).subscribe(res => {
                res.data.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
                this.dataHandlerService.initErupt(res.data)
                if (this.modelValue.prop) {
                    this.dataHandlerService.objectToEruptValue(this.modelValue.prop, res.data)
                }
                this.flexErupt = res.data;
            })
        }
    }

    override onSaveProp() {
        this.modelValue.prop = {
            ...this.dataHandlerService.eruptValueToObject(this.flexErupt)
        }
    }

    override onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    override type(): NodeType {
        return NodeType.FlEX;
    }

    override name(): string {
        return "Flex";
    }


}
