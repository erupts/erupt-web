import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";

@Component({
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
    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    ngOnInit(): void {
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
        return "子节点";
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
    }

    onSaveProp(): void {
    }

    onSelect(): void {
        this.select.emit(this.modelValue);
    }

    type(): NodeType {
        return NodeType.SUB;
    }

}
