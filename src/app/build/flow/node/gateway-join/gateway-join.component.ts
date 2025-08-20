import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NodeRule, NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {insertFlexNodeFun} from "@flow/util/flow.util";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";

@Component({
  selector: 'app-gateway-join',
  templateUrl: './gateway-join.component.html',
  styleUrls: ['./gateway-join.component.less']
})
export class GatewayJoinComponent {

    protected readonly nodeType = NodeType;

    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    onInsertNode(type: NodeType) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

     onInsertFlexNode(flex: FlexNodeModel) {
         insertFlexNodeFun(this.branch, this.index, flex);
     }


}
