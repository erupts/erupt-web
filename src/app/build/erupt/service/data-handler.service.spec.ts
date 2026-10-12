import {DatePipe} from "@angular/common";
import {DataHandlerService} from "./data-handler.service";
import {DateEnum, EditType} from "../model/erupt.enum";
import {QueryExpression} from "../model/erupt.vo";
import {EruptModel, Tree} from "../model/erupt.model";

// Only the date pipe is read off the i18n service
const service = new DataHandlerService({datePipe: new DatePipe("en-US")} as any);

// A searchable field as the backend schema delivers it, with the user's input in edit.$value
function field(fieldName: string, edit: any): any {
    return {fieldName, eruptFieldJson: {edit: {search: {value: true}, ...edit}, views: []}};
}

function model(...fields: any[]): EruptModel {
    return {eruptFieldModels: fields} as any;
}

function tree(id: string, level: number, children?: Tree[]): Tree {
    return {id, label: "L" + id, level, children, data: {id}} as any;
}

describe("DataHandlerService", () => {

    describe("buildSearchConditions", () => {
        it("skips non-searchable and empty fields", () => {
            const conditions = service.buildSearchConditions(model(
                {fieldName: "hidden", eruptFieldJson: {edit: {type: EditType.INPUT, search: {value: false}, $value: "x"}}},
                field("blank", {type: EditType.INPUT, $value: "   "}),
                field("unset", {type: EditType.NUMBER, $value: null})
            ));
            expect(conditions).toEqual([]);
        });

        it("wraps input values with the selected prefix and suffix, trimmed", () => {
            const conditions = service.buildSearchConditions(model(
                field("url", {type: EditType.INPUT, $operator: QueryExpression.LIKE, $value: "erupt", inputType: {prefixValue: "https://", suffixValue: ".xyz "}})
            ));
            expect(conditions).toEqual([{key: "url", value: "https://erupt.xyz", expression: QueryExpression.LIKE}]);
        });

        it("sends NULL / NOT_NULL without a value even when the input is empty", () => {
            const conditions = service.buildSearchConditions(model(
                field("a", {type: EditType.INPUT, $operator: QueryExpression.NULL}),
                field("b", {type: EditType.NUMBER, $operator: QueryExpression.NOT_NULL, $value: 3})
            ));
            expect(conditions).toEqual([
                {key: "a", value: null, expression: QueryExpression.NULL},
                {key: "b", value: null, expression: QueryExpression.NOT_NULL}
            ]);
        });

        it("builds a number range from either bound", () => {
            const conditions = service.buildSearchConditions(model(
                field("price", {type: EditType.NUMBER, $operator: QueryExpression.RANGE, $l_val: 10}),
                field("stock", {type: EditType.NUMBER, $operator: QueryExpression.RANGE})
            ));
            expect(conditions).toEqual([{key: "price", value: [10, null], expression: QueryExpression.RANGE}]);
        });

        it("formats a time range from the two time pickers", () => {
            const conditions = service.buildSearchConditions(model(
                field("t", {
                    type: EditType.DATE, dateType: {type: DateEnum.TIME}, $operator: QueryExpression.RANGE,
                    $l_val: new Date(2026, 0, 5, 9, 30, 15), $r_val: null
                })
            ));
            expect(conditions[0].value).toEqual(["09:30:15", null]);
        });

        it("expands a date range to whole days and keeps a datetime range exact", () => {
            const from = new Date(2026, 0, 5, 9, 30, 15, 123);
            const to = new Date(2026, 0, 7, 18, 0, 0, 0);
            const conditions = service.buildSearchConditions(model(
                field("d", {type: EditType.DATE, dateType: {type: DateEnum.DATE}, $operator: QueryExpression.RANGE, $value: [from, to]}),
                field("dt", {type: EditType.DATE, dateType: {type: DateEnum.DATE_TIME}, $operator: QueryExpression.RANGE, $value: [from, to]})
            ));
            expect(conditions[0].value).toEqual(["2026-01-05T00:00:00.000", "2026-01-07T23:59:59.999"]);
            expect(conditions[1].value).toEqual(["2026-01-05T09:30:15.123", "2026-01-07T18:00:00.000"]);
        });

        it("formats a single date by its date type", () => {
            const conditions = service.buildSearchConditions(model(
                field("m", {type: EditType.DATE, dateType: {type: DateEnum.MONTH}, $operator: QueryExpression.EQ, $value: new Date(2026, 2, 9)})
            ));
            expect(conditions[0].value).toBe("2026-03");
        });

        it("normalizes reference values to the configured id / label keys", () => {
            const conditions = service.buildSearchConditions(model(
                field("dept", {type: EditType.REFERENCE_TABLE, referenceTableType: {id: "code", label: "title"}, $value: {code: 7, title: "R&D", extra: 1}}),
                field("org", {type: EditType.REFERENCE_TREE, referenceTreeType: {id: "oid", label: "oname"}, $value: {id: 3, label: "HQ"}})
            ));
            expect(conditions).toEqual([
                {key: "dept", value: {code: 7, title: "R&D"}, expression: undefined},
                {key: "org", value: {oid: 3, oname: "HQ"}, expression: undefined}
            ]);
        });

        it("maps IN lists of references the same way", () => {
            const conditions = service.buildSearchConditions(model(
                field("orgs", {
                    type: EditType.REFERENCE_TREE, referenceTreeType: {id: "oid", label: "oname"}, $operator: QueryExpression.IN,
                    $value: [{id: 1, label: "A"}, {id: 2, label: "B"}]
                }),
                field("none", {type: EditType.CHOICE, $operator: QueryExpression.NOT_IN, $value: []})
            ));
            expect(conditions).toEqual([
                {key: "orgs", value: [{oid: 1, oname: "A"}, {oid: 2, oname: "B"}], expression: QueryExpression.IN}
            ]);
        });

        it("joins tags with the separator, or as JSON for []", () => {
            const conditions = service.buildSearchConditions(model(
                field("csv", {type: EditType.TAGS, tagsType: {joinSeparator: "|"}, $value: ["a", "b"]}),
                field("json", {type: EditType.TAGS, tagsType: {joinSeparator: "[]"}, $value: ["a", "b"]})
            ));
            expect(conditions.map(c => c.value)).toEqual(["a|b", '["a","b"]']);
        });

        it("keeps falsy but present values such as 0 and false", () => {
            const conditions = service.buildSearchConditions(model(
                field("n", {type: EditType.NUMBER, $value: 0}),
                field("b", {type: EditType.BOOLEAN, $value: false})
            ));
            expect(conditions.map(c => c.value)).toEqual([0, false]);
        });
    });

    describe("search operators", () => {
        it("fills defaults without overriding a chosen operator, and reset restores them", () => {
            const m = model(
                field("name", {type: EditType.INPUT}),
                field("created", {type: EditType.DATE}),
                field("custom", {type: EditType.INPUT, search: {value: true, operator: QueryExpression.LIKE}}),
                field("picked", {type: EditType.NUMBER, $operator: QueryExpression.GT})
            );
            service.initSearchOperators(m);
            const ops = () => m.eruptFieldModels.map(f => f.eruptFieldJson.edit.$operator);
            expect(ops()).toEqual([QueryExpression.EQ, QueryExpression.RANGE, QueryExpression.LIKE, QueryExpression.GT]);
            service.resetSearchOperators(m);
            expect(ops()).toEqual([QueryExpression.EQ, QueryExpression.RANGE, QueryExpression.LIKE, QueryExpression.EQ]);
        });
    });

    describe("trees", () => {
        const nodes = [
            tree("1", 1, [tree("1-1", 2, [tree("1-1-1", 3)]), tree("1-2", 2, [])]),
            tree("2", 1)
        ];

        it("counts every node at every depth", () => {
            expect(service.countNodes(nodes)).toBe(5);
            expect(service.countNodes([])).toBe(0);
        });

        it("converts to zorro nodes, expanding up to the given level and marking leaves", () => {
            const [one, two] = service.dataTreeToZorroTree(nodes, 1);
            expect(one).toMatchObject({key: "1", title: "L1", expanded: true, data: {id: "1"}});
            expect(one.isLeaf).toBeUndefined();
            expect(one.children[0]).toMatchObject({key: "1-1", expanded: false});
            expect(one.children[0].children[0].isLeaf).toBe(true);
            // an empty children array is a leaf too
            expect(one.children[1].isLeaf).toBe(true);
            expect(two.isLeaf).toBe(true);
        });
    });

    it("eruptObjectToCondition trims strings and keeps other values", () => {
        expect(service.eruptObjectToCondition({a: " x ", b: 2, c: null})).toEqual([
            {key: "a", value: "x"},
            {key: "b", value: 2},
            {key: "c", value: null}
        ]);
    });

    describe("dateFormat", () => {
        const date = new Date(2026, 6, 4, 13, 5, 9, 7);
        it.each([
            [DateEnum.DATE, "2026-07-04"],
            [DateEnum.DATE_TIME, "2026-07-04T13:05:09.007"],
            [DateEnum.MONTH, "2026-07"],
            [DateEnum.YEAR, "2026"],
            [DateEnum.TIME, "13:05:09"]
        ])("%s → %s", (type, expected) => {
            expect(service.dateFormat(date, {dateType: {type}} as any)).toBe(expected);
        });
    });
});
