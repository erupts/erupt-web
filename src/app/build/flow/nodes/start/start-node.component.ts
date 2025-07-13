import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/nodes/abstract-node";

@Component({
    selector: 'app-start-node',
    templateUrl: './start-node.component.html',
    styleUrls: ['./start-node.component.less']
})
export class StartNodeComponent extends ANode {
    @Input() readonly = false;
    @Input() model: any;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Output() modelChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    showErr = false;
    errInfo: any = null;

    validate(err: any[]) {
        // 开始节点无需验证
    }

    onSelect() {
        this.select.emit(this.model);
    }

    onInsertNode(type: string) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    code(): string {
        return "start";
    }

    color(): string {
        return "#80929C";
    }

    name(): string {
        return "发起人";
    }

    create(): any {
        return {
            type: this.code(),
            name: this.name(),
        }
    }

}
