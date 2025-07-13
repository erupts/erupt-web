import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ANode} from "@flow/nodes/abstract-node";
import {getRandNodeId} from "@flow/utils/process-util";

@Component({
    selector: 'app-exclusive-node',
    templateUrl: './exclusive-node.component.html',
    styleUrls: ['./exclusive-node.component.less']
})
export class ExclusiveNodeComponent extends ANode {


    @Input() readonly = false;
    @Input() modelValue: any;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() moveLn = false;
    @Input() moveRn = false;
    @Input() isDefault = false;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

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

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    code(): string {
        return "exclusive";
    }

    color(): string {
        return "#59B9A4";
    }

    name(): string {
        return "互斥条件";
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
            type: 'exclusive',
            name: i ? '条件' + i : '默认条件',
            parentId: null,
            childId: null
        };
    }
}
