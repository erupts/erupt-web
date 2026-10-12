import {RecentMenus} from "@shared/util/recent-menu.util";

describe("RecentMenus", () => {

    beforeEach(() => localStorage.clear());

    it("lists newest first and counts repeat visits", () => {
        RecentMenus.push("/build/a", "A");
        RecentMenus.push("/build/b", "B");
        RecentMenus.push("/build/a", "A renamed");
        const list = RecentMenus.list();
        expect(list.map(i => i.link)).toEqual(["/build/a", "/build/b"]);
        expect(list[0]).toMatchObject({text: "A renamed", count: 2});
        expect(list[1].count).toBe(1);
    });

    it("ignores the root and empty links", () => {
        RecentMenus.push("/", "Home");
        RecentMenus.push("", "Nothing");
        expect(RecentMenus.list()).toEqual([]);
    });

    it("caps the list", () => {
        for (let i = 0; i < RecentMenus.MAX + 5; i++) {
            RecentMenus.push("/m/" + i, "M" + i);
        }
        const list = RecentMenus.list();
        expect(list).toHaveLength(RecentMenus.MAX);
        expect(list[0].link).toBe("/m/" + (RecentMenus.MAX + 4));
    });

    it("counts on from entries written before counting existed", () => {
        localStorage.setItem(RecentMenus.KEY, JSON.stringify([{link: "/old", text: "Old", at: 1}]));
        RecentMenus.push("/old", "Old");
        expect(RecentMenus.list()[0].count).toBe(2);
    });

    it("removes and clears", () => {
        RecentMenus.push("/a", "A");
        RecentMenus.push("/b", "B");
        RecentMenus.remove("/a");
        expect(RecentMenus.list().map(i => i.link)).toEqual(["/b"]);
        RecentMenus.clear();
        expect(localStorage.getItem(RecentMenus.KEY)).toBeNull();
    });

    it.each([
        ["{broken"],
        ['{"link": "/a"}'],
        ['[null, {"text": "no link"}, {"link": "/ok", "text": "OK"}]']
    ])("survives corrupt storage %s", raw => {
        localStorage.setItem(RecentMenus.KEY, raw);
        expect(RecentMenus.list().every(i => i.link)).toBe(true);
    });
});
