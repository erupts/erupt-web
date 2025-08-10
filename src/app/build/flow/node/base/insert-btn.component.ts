import {Component, EventEmitter, Output} from '@angular/core';
import {Nodes} from '../process-nodes';
import {ANode} from "@flow/node/abstract-node";
import {NodeType} from "@flow/model/node.model";
import {FlowDataService} from "@flow/service/flow-data.service";
import {FlexNodeModel} from "@flow/model/flex-node.model";

@Component({
    selector: 'app-insert-btn',
    templateUrl: './insert-btn.component.html',
    styleUrls: ['./insert-btn.component.less']
})
export class InsertBtnComponent {

    @Output() insertNode = new EventEmitter<string>();

    @Output() insertFlexNode = new EventEmitter<FlexNodeModel>();

    popoverVisible: boolean = false;

    nodeList: ANode[] = Nodes;

    nodeType = NodeType

    flexNodes: FlexNodeModel[] = [];

    constructor(flowDataService: FlowDataService) {
        this.flexNodes = flowDataService.flexNodes;
    }


    onInsertNode(type: NodeType) {
        this.insertNode.emit(type);
        this.popoverVisible = false;
    }

    onInsertFlexNode(flexNode: FlexNodeModel) {
        this.insertFlexNode.emit(flexNode);
        this.popoverVisible = false;
    }

}
