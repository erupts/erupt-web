import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ANode} from "@flow/node/abstract-node";
import {geneNodeId, insertFlexNodeFun} from "@flow/util/flow.util";
import {NodeRule, NodeType} from "@flow/model/node.model";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FlexNodeModel} from "@flow/model/flex-node.model";
import {CcNode, ReviewMode} from "@flow/model/flow-approval.model";
import {FlowTurn} from "@flow/model/flow-instance.model";
import {I18NService} from "@core";

@Component({
    standalone: false,
    selector: 'app-cc-node',
    templateUrl: './cc-node.component.html',
    styleUrls: ['./cc-node.component.less']
})
export class CcNodeComponent extends ANode implements OnInit {

    @Input() flowRule: NodeRule[];
    @Input() readonly = false;
    @Input() eruptBuild: EruptBuildModel;
    @Input() modelValue: NodeRule;
    @Input() branch: any[] = [];
    @Input() index = 0;
    @Input() progress: Record<string, FlowTurn>;

    @Output() modelValueChange = new EventEmitter<any>();
    @Output() select = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() insertNode = new EventEmitter<any>();

    selectTab: number = 0;

    ccNode: CcNode = new CcNode();


    ngOnInit(): void {
        if (this.modelValue.prop) {
            this.ccNode = this.modelValue.prop;
        }
    }

    deleteReviewUser(index: number) {
        // Ensure at least one approver is retained
        if (this.ccNode.reviewUserModes.length > 1) {
            this.ccNode.reviewUserModes.splice(index, 1);
        }
    }

    addReviewUsers() {
        this.ccNode.reviewUserModes.push({
            mode: ReviewMode.SPECIFIED_USER,
            modeValue: null
        })
    }

    override onSelect() {
        this.select.emit(this.modelValue);
    }

    override onDelete() {
        this.delete.emit({
            branch: this.branch,
            index: this.index
        });
    }

    override onInsertNode(type: NodeType) {
        this.insertNode.emit({
            branch: this.branch,
            index: this.index,
            type: type
        });
    }

    override type(): NodeType {
        return NodeType.CC;
    }

    override color(): string {
        return "#5994F3";
    }

    constructor(private i18n?: I18NService) {
        super();
    }

    get ccTabOptions() {
        return [
            {value: 0, label: this.i18n.fanyi('flow.node.tab.set_cc')},
            {value: 1, label: this.i18n.fanyi('flow.node.tab.form_access')},
        ];
    }

    override name(): string {
        return I18NService.instance?.fanyi('flow.node.cc_label');
    }

    override create(): NodeRule {
        return {
            id: geneNodeId(),
            type: this.type(),
            name: this.name(),
            prop: new CcNode()
        }
    }

    override onInsertFlexNode(flex: FlexNodeModel) {
        insertFlexNodeFun(this.branch, this.index, flex);
    }

    override onSaveProp(): void {
        this.modelValue.prop = this.ccNode;
    }

    protected readonly NodeType = NodeType;
}
