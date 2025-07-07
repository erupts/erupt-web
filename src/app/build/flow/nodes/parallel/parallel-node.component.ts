import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/nodes/abstract-node";

@Component({
    selector: 'app-parallel-node',
    templateUrl: './parallel-node.component.html',
    styleUrls: ['./parallel-node.component.less']
})
export class ParallelNodeComponent implements ANode {
    @Input() readonly = false;
    @Input() modelValue: any;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() moveLn = false;
    @Input() isDefault = false;
    @Input() moveRn = false;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

    validate(err: any[]) {
        return true;
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

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    code(): string {
        return "parallel";
    }

    color(): string {
        return "#718dff";
    }

    name(): string {
        return "并行分支";
    }
}
