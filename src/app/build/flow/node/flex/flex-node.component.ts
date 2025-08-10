import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NodeRule, NodeType} from "@flow/model/node.model";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {ANode} from "@flow/node/abstract-node";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowDataService} from "@flow/service/flow-data.service";

@Component({
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

    flexErupt: EruptBuildModel;

    constructor(private flowApiService?: FlowApiService,
                private flowDataService?: FlowDataService) {
        super();
    }

    ngOnInit(): void {
        if (this.modelValue?.flex) {
            this.flowApiService.flexEruptFlowBuild(this.modelValue.flex).subscribe(res => {
                this.flexErupt = res.data;
            })
        }
    }

    onInsertNode(type: string) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    color(): string {
        if (this.modelValue?.flex) {
            for (let flexNode of this.flowDataService.flexNodes) {
                if (flexNode.code === this.modelValue.flex) {
                    return flexNode.color;
                }
            }
        }
        return "#000";
    }

    create(flex?: FlexNodeModel): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            flex: flex.code,
            name: flex.name,
        };
    }

    onSelect() {
        this.select.emit(this.modelValue);
    }

    onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    type(): NodeType {
        return NodeType.FlEX;
    }

    name(): string {
        return "Flex";
    }

}
