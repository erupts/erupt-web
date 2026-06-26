import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {FlowTurn} from "@flow/model/flow-instance.model";
import {I18NService} from "@core";

@Component({
    standalone: false,
    selector: 'app-branch-node',
    templateUrl: './branch-node.component.html',
    styleUrls: ['./branch-node.component.less']
})
export class BranchNodeComponent implements AfterViewInit, OnInit {

    @Input() eruptBuild: EruptBuildModel;
    @Output() insertFlexNode = new EventEmitter<FlexNodeModel>();

    @Input() moveLn = false;
    @Input() moveRn = false;
    @Input() type = '';
    @Input() color = '';
    @Input() headerIcon = '';
    @Input() content = '';
    @Input() readonly = false;
    @Input() modelValue: NodeRule;
    @Input() showError = false;
    @Input() errorInfo = '';
    @Input() isDefault = false;
    @Input() placeholder = '';
    @Input() desc = '';

    @Input() progress: Record<string, FlowTurn>;

    @Output() modelValueChange = new EventEmitter<NodeRule>();
    @Output() select = new EventEmitter<void>();
    @Output() delete = new EventEmitter<void>();
    @Output() insertNode = new EventEmitter<NodeType>();
    @Output() copy = new EventEmitter<void>();
    @Output() moveL = new EventEmitter<void>();
    @Output() moveR = new EventEmitter<void>();

    @ViewChild('nodeNameInput', {static: false}) nodeNameInput!: ElementRef;


    enableEdit = false;

    constructor(private i18n: I18NService) {}

    ngOnInit() {
        if (!this.placeholder) {
            this.placeholder = this.i18n.fanyi('flow.node.placeholder_default');
        }
    }

    ngAfterViewInit() {
        // Post-initialization logic
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
        this.modelValue.error = null;
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

}
