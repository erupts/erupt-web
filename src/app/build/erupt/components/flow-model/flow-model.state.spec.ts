import {of} from "rxjs";
import {FlowModelState} from "./flow-model.state";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {Status} from "../../model/erupt-api.model";

// Only what the state reads off the model
function buildModel(tags?: Record<string, any>): any {
    return {eruptModel: {eruptName: "Supplier", tags, eruptFieldModels: []}};
}

class Probe extends FlowModelState {
    readyCount = 0;

    protected override activated(): void {
        this.readyCount++;
    }
}

function setup(properties: Record<string, any> = {"erupt-flow": true}) {
    vi.spyOn(EruptAppData, "get").mockReturnValue({properties} as any);
    const dataService: any = {
        flowModel: vi.fn(() => of({data: {flow: false, actions: [], configurable: false, flows: []}})),
        flowPendingChanges: vi.fn(() => of({data: []})),
        flowMarks: vi.fn(() => of({data: {}})),
        flowRecordFlows: vi.fn(() => of({data: []})),
        flowCandidates: vi.fn(() => of({data: []})),
        flowSelfSelectNodes: vi.fn(() => of({data: []})),
        flowSelfSelectNodeUsers: vi.fn(() => of({data: []}))
    };
    return {state: new Probe(dataService), dataService};
}

describe("FlowModelState", () => {

    afterEach(() => vi.restoreAllMocks());

    describe("load", () => {
        it("asks nothing when erupt-flow is not installed", () => {
            const {state, dataService} = setup({});
            state.load(buildModel());
            expect(state.active).toBe(false);
            expect(dataService.flowModel).not.toHaveBeenCalled();
        });

        it("is active at once for a model declaring @EruptFlow, without announcing it again", () => {
            const {state, dataService} = setup();
            dataService.flowModel.mockReturnValue(of({data: {flow: true, actions: ["EDIT"], configurable: true, flows: [{id: 1}]}}));

            state.load(buildModel({EruptFlow: {}}));

            expect(state.active).toBe(true);
            expect(state.flowActions).toEqual(["EDIT"]);
            expect(state.flowConfigurable).toBe(true);
            expect(state.boundFlows).toEqual([{id: 1}]);
            expect(state.readyCount).toBe(0);
        });

        it("turns active when a flow is bound to a model that declares none, and reads what is pending", () => {
            const {state, dataService} = setup();
            dataService.flowModel.mockReturnValue(of({data: {flow: true, actions: ["ADD"]}}));
            dataService.flowPendingChanges.mockReturnValue(of({data: [{no: "ER_1"}]}));

            state.load(buildModel());

            expect(state.active).toBe(true);
            expect(state.readyCount).toBe(1);
            expect(state.pendingChanges).toEqual([{no: "ER_1"}]);
        });

        it("forgets the previous model", () => {
            const {state} = setup();
            state.marks = {"1": {no: "ER_1", count: 1}};
            state.pendingChanges = [{no: "ER_1"}];
            state.load(buildModel());
            expect(state.marks).toEqual({});
            expect(state.pendingChanges).toEqual([]);
        });
    });

    describe("refresh", () => {
        it("does not ask for a model without flows", () => {
            const {state, dataService} = setup();
            state.load(buildModel());
            state.refresh();
            expect(dataService.flowPendingChanges).not.toHaveBeenCalled();
        });
    });

    describe("marks", () => {
        it("are not asked for a model without flows, and what was shown is dropped", () => {
            const {state, dataService} = setup();
            state.load(buildModel());
            state.marks = {"1": {no: "ER_1", count: 1}};
            state.loadMarks([1, 2]);
            expect(dataService.flowMarks).not.toHaveBeenCalled();
            expect(state.marks).toEqual({});
        });

        it("are asked by the ids on screen as text, skipping rows without a key", () => {
            const {state, dataService} = setup();
            state.load(buildModel({EruptFlow: {}}));
            dataService.flowMarks.mockReturnValue(of({data: {"3": {no: "ER_3", pending: "DELETE", count: 2}}}));
            const done = vi.fn();

            state.loadMarks([3, null, "x", undefined], done);

            expect(dataService.flowMarks).toHaveBeenCalledWith("Supplier", ["3", "x"]);
            expect(done).toHaveBeenCalledTimes(1);
            // a numeric key finds its mark
            expect(state.mark(3)).toEqual({no: "ER_3", pending: "DELETE", count: 2});
            expect(state.mark("x")).toBeUndefined();
            expect(state.mark(null)).toBeUndefined();
        });

        it("are dropped when the page is empty", () => {
            const {state, dataService} = setup();
            state.load(buildModel({EruptFlow: {}}));
            state.marks = {"1": {no: "ER_1", count: 1}};
            state.loadMarks([]);
            expect(dataService.flowMarks).not.toHaveBeenCalled();
            expect(state.marks).toEqual({});
        });
    });

    describe("flowsOf", () => {
        it("puts the one in progress first and keeps the server's order otherwise", () => {
            const {state, dataService} = setup();
            state.load(buildModel({EruptFlow: {}}));
            dataService.flowRecordFlows.mockReturnValue(of({
                data: [{no: "A", status: "FINISH"}, {no: "B", status: "PENDING"}, {no: "C", status: "REJECTED"}]
            }));
            let flows: any[];
            state.flowsOf(5).subscribe(res => flows = res);
            expect(flows.map(f => f.no)).toEqual(["B", "A", "C"]);
        });
    });

    describe("pickNeeded", () => {
        function served(actions: string[]) {
            const ctx = setup();
            ctx.dataService.flowModel.mockReturnValue(of({data: {flow: true, actions}}));
            ctx.state.load(buildModel({EruptFlow: {}}));
            return ctx;
        }

        it("asks nothing for an operation no flow serves", async () => {
            const {state, dataService} = served(["EDIT"]);
            expect(await state.pickNeeded("DELETE")).toBe(false);
            expect(dataService.flowCandidates).not.toHaveBeenCalled();
        });

        it("leaves a missing flow to the server to report", async () => {
            const {state} = served(["EDIT"]);
            // served, but through no flow this user may submit to
            expect(await state.pickNeeded("EDIT")).toBe(false);
        });

        it("is false for the only flow when it has nobody to pick", async () => {
            const {state, dataService} = served(["EDIT"]);
            dataService.flowCandidates.mockReturnValue(of({data: [{id: 4, name: "Edit"}]}));
            expect(await state.pickNeeded("EDIT")).toBe(false);
        });

        it("is true among several flows, the first one chosen to start with", async () => {
            const {state, dataService} = served(["EDIT"]);
            dataService.flowCandidates.mockReturnValue(of({data: [{id: 4}, {id: 6}]}));
            expect(await state.pickNeeded("EDIT")).toBe(true);
            expect(state.flowChoices).toHaveLength(2);
            expect(state.flowChoice).toBe(4);

            await state.chooseFlow(6);
            expect(state.pickedHeader()).toEqual({
                "erupt-flow-id": "6",
                "erupt-flow-assignees": encodeURIComponent("{}")
            });
        });

        it("is true for one flow whose node needs people, and tells which node still has none", async () => {
            const {state, dataService} = served(["ADD"]);
            dataService.flowCandidates.mockReturnValue(of({data: [{id: 4}]}));
            dataService.flowSelfSelectNodes.mockReturnValue(of({data: [{key: "N1", value: "Approver"}, {key: "N2", value: "Copy"}]}));
            dataService.flowSelfSelectNodeUsers.mockReturnValue(of({data: [{id: 7, name: "Ann"}]}));

            expect(await state.pickNeeded("ADD")).toBe(true);
            expect(state.selfSelectOptions["N1"]).toEqual([{id: 7, name: "Ann"}]);
            expect(state.missingPick()).toEqual({key: "N1", value: "Approver"});

            state.selfSelectPicks["N1"] = [7];
            expect(state.missingPick()).toEqual({key: "N2", value: "Copy"});
            state.selfSelectPicks["N2"] = [];
            expect(state.missingPick()?.key).toBe("N2");
            state.selfSelectPicks["N2"] = [7];
            expect(state.missingPick()).toBeUndefined();

            expect(state.pickedHeader()).toEqual({
                "erupt-flow-id": "4",
                "erupt-flow-assignees": encodeURIComponent(JSON.stringify({N1: [7], N2: [7]}))
            });
        });

        it("drops the picks made for another flow", async () => {
            const {state} = served(["ADD"]);
            state.selfSelectPicks = {N1: [7]};
            await state.chooseFlow(9);
            expect(state.flowChoice).toBe(9);
            expect(state.selfSelectPicks).toEqual({});
        });
    });

    describe("submitted", () => {
        it("recognises a change an approval flow took over", () => {
            const {state} = setup();
            expect(state.submitted({status: Status.INFO})).toBe(true);
            expect(state.submitted({status: Status.SUCCESS})).toBe(false);
            expect(state.submitted(null)).toBe(false);
        });
    });

    describe("pendingCell", () => {
        it("shows a reference by its label and an empty value as a dash", () => {
            const {state} = setup();
            const form = {name: "Acme", org: {id: 3, name: "Sales"}, blank: "", none: null, zero: 0};
            expect(state.pendingCell(form, "name")).toBe("Acme");
            expect(state.pendingCell(form, "org")).toBe("Sales");
            expect(state.pendingCell(form, "blank")).toBe("—");
            expect(state.pendingCell(form, "none")).toBe("—");
            expect(state.pendingCell(form, "missing")).toBe("—");
            expect(state.pendingCell(form, "zero")).toBe(0);
        });
    });
});
