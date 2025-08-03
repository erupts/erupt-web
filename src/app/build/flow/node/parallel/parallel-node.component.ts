import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {getRandNodeId} from "@flow/utils/process-util";

@Component({
    selector: 'app-parallel-node',
    templateUrl: './parallel-node.component.html',
    styleUrls: ['./parallel-node.component.less']
})
export class ParallelNodeComponent extends ANode {
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

    create() {
        return {
            id: getRandNodeId() + '_fork',
            type: 'gateway',
            name: '网关节点',
            props: {
                type: this.code(),
                branch: [
                    // 默认创建俩分支
                    this.createBranch(1),
                    this.createBranch()
                ]
            },
            branch: [[], []] // 默认要创建2个空分支
        }
    }

    override createBranch(i?: number) {
        return {
            id: getRandNodeId(),
            type: 'parallel',
            name: '并行路径' + (i ? i : 2),
            parentId: null,
            childId: null,
        };
    }
}
