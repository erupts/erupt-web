import {Component, EventEmitter, HostListener, Inject, Output, TemplateRef, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {DataService} from "@shared/service/data.service";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {openResizableDrawer} from "@shared/component/resizable-drawer.component";
import {getAvatarColor, getStatusColor, isChange} from "@flow/util/flow.util";
import {FlowAction} from "@flow/model/flow.model";
import {FlowModelState} from "./flow-model.state";

/**
 * The flows of a model, for whichever view lists its records (table, tree): which operations go through
 * approval, the flow and people to submit with, the changes still pending and the approvals of a record.
 * The host view renders {@link actions} among its toolbar buttons and re-reads its data on {@link changed}.
 */
@Component({
    standalone: false,
    selector: "erupt-flow-model",
    templateUrl: "./flow-model.component.html",
    styleUrls: ["./flow-model.component.less"]
})
export class FlowModelComponent extends FlowModelState {

    // the model turned out to run through flows without declaring @EruptFlow: the view shows its flow entries
    @Output() ready = new EventEmitter<void>();

    // records or pending changes may have moved (a decision in the detail drawer, on another page)
    @Output() changed = new EventEmitter<void>();

    @ViewChild("actions", {static: true})
    actions: TemplateRef<any>;

    @ViewChild("flowPickTpl", {static: true})
    flowPickTpl: TemplateRef<any>;

    flowSettingsVisible = false;

    pendingVisible = false;

    constructor(dataService: DataService,
                private router: Router,
                private i18n: I18NService,
                private drawerService: NzDrawerService,
                @Inject(NzModalService) private modal: NzModalService,
                @Inject(NzMessageService) private msg: NzMessageService) {
        super(dataService);
    }

    protected override activated(): void {
        this.ready.emit();
    }

    // back on the tab after deciding elsewhere (the approval page, another user): re-read while changes are pending
    @HostListener("document:visibilitychange")
    onVisible() {
        if (!document.hidden && this.pendingChanges.length) this.changed.emit();
    }

    // Edit a bound flow, or design a new one on this model, in the flow designer; closing it comes back here
    openFlowConfig(flowId?: number) {
        this.flowSettingsVisible = false;
        // `t` makes every visit a new one for the kept-alive designer page; navigating after the popover has
        // closed, as the view is detached (kept alive too) on leaving and would keep it on screen
        const t = Date.now();
        setTimeout(() => this.router.navigate(["/flow/management"], {
            queryParams: flowId ? {flowId, t} : {erupt: this.eruptName, t}
        }));
    }

    openFlowDetail(no: string) {
        openResizableDrawer(this.drawerService, {
            nzClosable: false,
            nzKeyboard: true,
            nzMaskClosable: true,
            // @ts-ignore
            nzPlacement: "right",
            nzWidth: "60%",
            nzBodyStyle: {
                padding: 0
            },
            nzFooter: null,
            nzContent: EruptIframeComponent,
            nzContentParams: {
                url: location.origin + "/#/fill/flow/approval-detail/" + no,
                height: "100%",
                width: '100%'
            }
        }, "flow-approval").afterClose.subscribe(() => this.changed.emit()); // a decision there may move records and pending changes
    }

    // one approval opens directly; several list the record's history to pick from
    openMark(id: any) {
        const mark = this.mark(id);
        if (!mark) return;
        mark.count > 1 ? this.openRecordFlows(id) : this.openFlowDetail(mark.no);
    }

    // The approvals concerning one record: whoever can see the record reads them
    recordFlows: any[] = [];
    recordFlowsVisible = false;
    // tag and avatar colours of the approval page, so an instance looks the same here
    flowStatusColor = getStatusColor;
    flowAvatarColor = getAvatarColor;
    flowIsChange = isChange;

    openRecordFlows(id: any) {
        this.flowsOf(id).subscribe(flows => this.openFlows(flows));
    }

    openFlows(flows: any[]) {
        if (flows.length === 1) {
            this.openFlowDetail(flows[0].no);
        } else if (flows.length) {
            this.recordFlows = flows;
            this.recordFlowsVisible = true;
        }
    }

    // An operation the model sends through a flow goes through the one flow the user may submit to, or the one
    // they pick among several, with the people its self-select nodes need. Resolves to the headers carrying the
    // picks ({} with nothing to pick, the server then reports a missing flow), null on cancel.
    async header(action: keyof typeof FlowAction): Promise<Record<string, string> | null> {
        if (!await this.pickNeeded(action)) return {};
        return new Promise(resolve => {
            let done = false;
            this.modal.create({
                nzTitle: this.i18n.fanyi(this.flowChoices.length > 1 ? "table.flow_pick.title" : "table.flow_pick.assignees"),
                nzContent: this.flowPickTpl,
                nzWidth: 480,
                nzOnOk: () => {
                    const missing = this.missingPick();
                    if (missing) {
                        this.msg.warning(this.i18n.fanyi("table.flow_pick.assignee_required") + ": " + missing.value);
                        return false;
                    }
                    done = true;
                    return true;
                }
            }).afterClose.subscribe(() => resolve(done ? this.pickedHeader() : null));
        });
    }

}
