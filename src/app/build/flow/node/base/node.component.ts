import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {FlowTurn} from "@flow/model/flow-instance.model";

@Component({
    selector: 'erupt-node',
    templateUrl: './node.component.html',
    styleUrls: ['./node.component.less']
})
export class NodeComponent implements AfterViewInit {

    @Input() eruptBuild: EruptBuildModel;
    @Input() headerColor = '';
    @Input() headerIcon = '';
    @Input() content = '';
    @Input() readonly = false;
    @Input() model: NodeRule;
    @Input() showClose = true;
    @Input() showBody = true;
    @Input() hasConfig: boolean = true;

    @Input() progress: Record<string, FlowTurn>;

    @Output() modelChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<void>();
    @Output() delete = new EventEmitter<void>();
    @Output() insertNode = new EventEmitter<NodeType>();

    @Output() saveProp = new EventEmitter<void>();

    @Output() insertFlexNode = new EventEmitter<FlexNodeModel>();

    @ViewChild('nodeNameInput', {static: false}) nodeNameInput!: ElementRef;

    showDrawer: boolean = false;

    enableEdit = false;

    constructor() {

    }


    ngAfterViewInit() {

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
        if (!this.hasConfig || this.readonly) {
            return;
        }
        this.model.error = null;
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

    close(): void {
        this.showDrawer = false;
    }

    save(): void {
        this.saveProp.emit();
        this.showDrawer = false;
    }

    protected readonly process = module
}
