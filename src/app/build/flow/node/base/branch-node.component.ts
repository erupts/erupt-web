import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {NodeType} from "@flow/model/node.model";

@Component({
    selector: 'app-branch-node',
    templateUrl: './branch-node.component.html',
    styleUrls: ['./branch-node.component.less']
})
export class BranchNodeComponent implements AfterViewInit {

    @Input() eruptBuild: EruptBuildModel;
    @Output() insertFlexNode = new EventEmitter<FlexNodeModel>();

    @Input() moveLn = false;
    @Input() moveRn = false;
    @Input() type = '';
    @Input() color = '';
    @Input() headerIcon = '';
    @Input() content = '';
    @Input() readonly = false;
    @Input() modelValue: any;
    @Input() showError = false;
    @Input() errorInfo = '';
    @Input() isDefault = false;
    @Input() placeholder = '请设置';
    @Input() desc = '';

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<void>();
    @Output() delete = new EventEmitter<void>();
    @Output() insertNode = new EventEmitter<NodeType>();
    @Output() copy = new EventEmitter<void>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

    @ViewChild('nodeNameInput', {static: false}) nodeNameInput!: ElementRef;

    showDrawer: boolean = false;

    enableEdit = false;

    ngAfterViewInit() {
        // 组件初始化后的处理
    }

    onEnableEdit() {
        if (!this.readonly) {
            this.enableEdit = true;
            setTimeout(() => {
                if (this.nodeNameInput) {
                    this.nodeNameInput.nativeElement.focus();
                }
            });
        }
    }

    onBlur() {
        this.enableEdit = false;
    }

    onSelect() {
        this.showDrawer = true;
        this.select.emit();
    }

    onDelete() {
        this.delete.emit();
    }

    onInsertNode(type: NodeType) {
        this.insertNode.emit(type);
    }

    onInsertFlexNode(flex: FlexNodeModel) {
        this.insertFlexNode.emit(flex);
    }

    onCopy() {
        this.copy.emit();
    }

    onMoveL() {
        this.moveL.emit();
    }

    onMoveR() {
        this.moveR.emit();
    }

    close(): void {
        this.showDrawer = false;
    }
}
