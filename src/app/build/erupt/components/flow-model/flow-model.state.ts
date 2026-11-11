import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DataService} from "@shared/service/data.service";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {FlowAction} from "@flow/model/flow.model";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {Status} from "../../model/erupt-api.model";

/** What a record's flow button shows, mirrors xyz.erupt.flow.pojo.vo.RecordMarkVo. */
export interface FlowMark {
    // the latest instance
    no: string;
    // the edit or delete awaiting approval, which freezes the record
    pending?: keyof typeof FlowAction;
    // instances concerning the record
    count: number;
}

/**
 * What a view knows about the flows of its model, and what it asks the server for: free of templates and
 * dialogs, which FlowModelComponent adds on top.
 */
export class FlowModelState {

    eruptBuildModel: EruptBuildModel;

    // A model need not declare @EruptFlow to run through flows: the flow configs bound to it decide, per tenant,
    // so the view asks once instead of reading a tag shared by every tenant
    active = false;
    flowActions: string[] = [];
    // a flow designer sees the flows bound to the model from its view, and opens them in the designer
    flowConfigurable = false;
    boundFlows: { id: number, name: string, enable: boolean, actions: string[], persist: string }[] = [];

    constructor(protected dataService: DataService) {
    }

    protected get eruptName(): string {
        return this.eruptBuildModel.eruptModel.eruptName;
    }

    // the model turned out to run through flows without declaring @EruptFlow
    protected activated(): void {
    }

    load(eruptBuildModel: EruptBuildModel) {
        this.eruptBuildModel = eruptBuildModel;
        this.active = !!eruptBuildModel.eruptModel.tags?.["EruptFlow"];
        this.flowActions = [];
        this.flowConfigurable = false;
        this.boundFlows = [];
        this.pendingChanges = [];
        this.marks = {};
        if (!EruptAppData.get().properties?.["erupt-flow"]) return;
        this.dataService.flowModel(this.eruptName).subscribe(res => {
            this.flowActions = res.data?.actions || [];
            this.flowConfigurable = !!res.data?.configurable;
            this.boundFlows = res.data?.flows || [];
            if (res.data?.flow && !this.active) {
                this.active = true;
                this.refresh();
                this.activated();
            }
        });
    }

    // Changes of the current user still waiting for approval: an insert has no record until approved, so the
    // view lists them beside its records
    pendingChanges: any[] = [];

    refresh() {
        if (!this.active) return;
        this.dataService.flowPendingChanges(this.eruptName).subscribe(res => this.pendingChanges = res.data || []);
    }

    // the first few listed fields, enough to tell the pending records apart
    get pendingFields(): EruptFieldModel[] {
        return this.eruptBuildModel.eruptModel.eruptFieldModels
            .filter(f => f.eruptFieldJson.views?.[0]?.show !== false && f.eruptFieldJson.views?.[0]?.title).slice(0, 4);
    }

    // a reference cell holds {id, label}: show its label; an empty value shows a dash
    pendingCell(form: any, field: string): any {
        let value = form?.[field];
        if (value && typeof value === "object") value = Object.entries(value).find(([k, v]) => k !== "id" && v != null)?.[1];
        return value == null || value === "" ? "—" : value;
    }

    // What the flow button of each record on screen shows, keyed by record id: asked once the view has its
    // records, so the records themselves carry no flow fields
    marks: Record<string, FlowMark> = {};

    loadMarks(ids: any[], done?: () => void) {
        const keys = ids.filter(id => id != null).map(String);
        if (!this.active || !keys.length) {
            this.marks = {};
            return;
        }
        this.dataService.flowMarks(this.eruptName, keys).subscribe(res => {
            this.marks = res.data || {};
            done?.();
        });
    }

    mark(id: any): FlowMark | undefined {
        return id == null ? undefined : this.marks[String(id)];
    }

    // The approvals concerning one record, the one in progress first, then by time as the server sends them
    flowsOf(id: any): Observable<any[]> {
        return this.dataService.flowRecordFlows(this.eruptName, id).pipe(map(res => {
            const flows: any[] = res.data || [];
            return [...flows.filter(f => f.status === "PENDING"), ...flows.filter(f => f.status !== "PENDING")];
        }));
    }

    // ── Flow picking ─────────────────────────────────────────────────────────
    flowChoices: any[] = [];
    flowChoice: number;
    // nodes of the chosen flow whose people the submitter picks: {key: nodeId, value: name}, their options and picks
    selfSelectNodes: { key: string, value: string }[] = [];
    selfSelectOptions: Record<string, any[]> = {};
    selfSelectPicks: Record<string, number[]> = {};

    // Whether the user has something to pick before the operation is sent: one of several flows, or the people
    // of a self-select node. With nothing to pick the request goes as it is, and the server reports a missing flow.
    async pickNeeded(action: keyof typeof FlowAction): Promise<boolean> {
        if (!this.flowActions.includes(action)) return false;
        const res = await this.dataService.flowCandidates(this.eruptName, action).toPromise();
        const flows: any[] = res?.data || [];
        if (!flows.length) return false;
        this.flowChoices = flows;
        await this.chooseFlow(flows[0].id);
        return flows.length > 1 || this.selfSelectNodes.length > 0;
    }

    // choosing a flow loads its self-select nodes and whom each may be given; earlier picks belong to another flow
    async chooseFlow(flowId: number) {
        this.flowChoice = flowId;
        this.selfSelectPicks = {};
        this.selfSelectOptions = {};
        this.selfSelectNodes = (await this.dataService.flowSelfSelectNodes(flowId).toPromise())?.data || [];
        for (const node of this.selfSelectNodes) {
            const users = await this.dataService.flowSelfSelectNodeUsers(flowId, node.key).toPromise();
            this.selfSelectOptions[node.key] = users?.data || [];
        }
    }

    // the first self-select node still without anyone
    missingPick(): { key: string, value: string } | undefined {
        return this.selfSelectNodes.find(node => !this.selfSelectPicks[node.key]?.length);
    }

    // the request headers carrying the picks
    pickedHeader(): Record<string, string> {
        return {
            "erupt-flow-id": String(this.flowChoice),
            "erupt-flow-assignees": encodeURIComponent(JSON.stringify(this.selfSelectPicks))
        };
    }

    // An operation an approval flow took over answers INFO: its dialog told the user, nothing changed yet
    submitted(res: { status: Status }): boolean {
        return res?.status === Status.INFO;
    }

}
