import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/nodes/abstract-node";
import {getRandNodeId} from "@flow/utils/process-util";

@Component({
    selector: 'app-cc-node',
    templateUrl: './cc-node.component.html',
    styleUrls: ['./cc-node.component.less']
})
export class CcNodeComponent extends ANode {
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

    code(): string {
        return "cc";
    }

    color(): string {
        return "#5994F3";
    }

    name(): string {
        return "抄送人";
    }

    create(): any {
        return {
            id: getRandNodeId(),
            type: this.code(),
            name: this.name(),
        }
    }
}
