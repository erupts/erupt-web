import {getStatusColor, insertFlexNodeFun, reloadNodeId} from "@flow/util/flow.util";
import {NodeType} from "@flow/model/node.model";
import {InstanceStatus, TaskStatus} from "@flow/model/flow-instance.model";

describe("flow.util", () => {

    describe("reloadNodeId", () => {
        it("regenerates ids through branches and gateway props", () => {
            const tree = {
                id: "ROOT",
                branch: [
                    {id: "A"},
                    {id: "B", props: {branch: [{id: "C"}, {id: "D", branch: [{id: "E"}]}]}}
                ]
            };
            reloadNodeId(tree);
            const ids = [tree.id, tree.branch[0].id, tree.branch[1].id,
                tree.branch[1].props.branch[0].id, tree.branch[1].props.branch[1].id,
                tree.branch[1].props.branch[1].branch[0].id];
            expect(ids).not.toContain("ROOT");
            expect(ids.some(id => ["A", "B", "C", "D", "E"].includes(id))).toBe(false);
            // a copied flow must not share ids, so every one is distinct
            expect(new Set(ids).size).toBe(ids.length);
        });

        it("leaves nodes without an id alone and tolerates non-objects", () => {
            const node: any = {name: "no id"};
            reloadNodeId(node);
            expect(node.id).toBeUndefined();
            expect(() => reloadNodeId(null)).not.toThrow();
            expect(() => reloadNodeId("x")).not.toThrow();
        });
    });

    it("insertFlexNodeFun inserts a flex node right after the given index", () => {
        const branch: any[] = [{id: "1"}, {id: "2"}];
        insertFlexNodeFun(branch, 0, {code: "notify", name: "Notify", color: "#123456"} as any);
        expect(branch).toHaveLength(3);
        expect(branch[1]).toMatchObject({type: NodeType.FlEX, flex: "notify", name: "Notify", color: "#123456"});
        expect(branch[1].id).toBeTruthy();
        expect(branch[2].id).toBe("2");
    });

    describe("getStatusColor", () => {
        it.each([
            [InstanceStatus.PENDING, "processing"],
            [TaskStatus.PENDING, "processing"],
            [InstanceStatus.FINISH, "success"],
            [TaskStatus.AGREED, "success"],
            [InstanceStatus.REJECTED, "error"],
            [TaskStatus.REJECTED, "error"],
            [InstanceStatus.TERMINATED, "error"],
            [InstanceStatus.WITHDRAWN, "warning"]
        ])("%s → %s", (status, color) => {
            expect(getStatusColor(status as any)).toBe(color);
        });

        it("falls back to the default tag for unknown statuses", () => {
            expect(getStatusColor("SOMETHING_ELSE" as any)).toBeNull();
        });
    });
});
