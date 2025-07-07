import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/nodes/abstract-node";

@Component({
    selector: 'app-approval-node',
    templateUrl: './approval-node.component.html',
    styleUrls: ['./approval-node.component.less']
})
export class ApprovalNodeComponent implements ANode {

    @Input() readonly = false;
    @Input() modelValue: any;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    showErr = false;
    errInfo: any = null;


    code(): string {
        return "approval";
    }

    name(): string {
        throw "审批人";
    }

    color(): string {
        return "#EC8151";
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

    onInsertNode(type: string) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    click(): void {
    }

}
