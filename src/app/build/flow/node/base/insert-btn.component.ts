import {Component, EventEmitter, Output} from '@angular/core';
import {Nodes} from '../process-nodes';
import {ANode} from "@flow/node/abstract-node";
import {NodeType} from "@flow/model/mode.model";

@Component({
    selector: 'app-insert-btn',
    templateUrl: './insert-btn.component.html',
    styleUrls: ['./insert-btn.component.less']
})
export class InsertBtnComponent {
    @Output() insertNode = new EventEmitter<string>();

    popoverVisible: boolean = false;

    nodeList: ANode[] = Nodes;

    nodeType = NodeType

    onInsertNode(type: string) {
        this.insertNode.emit(type);
        this.popoverVisible = false;
    }
}
