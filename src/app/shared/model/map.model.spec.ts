import {MapProvider, providerCrs, toMapPlace} from "@shared/model/map.model";
import {Crs, gcj02ToBd09} from "@shared/model/crs";

describe("map.model", () => {

    describe("toMapPlace", () => {
        it("reads the current shape", () => {
            const place = toMapPlace({id: "p1", name: "Office", address: "Road 1", lng: 120.1, lat: 30.2, crs: "WGS84"});
            expect(place).toEqual({id: "p1", name: "Office", address: "Road 1", lng: 120.1, lat: 30.2, crs: Crs.WGS84});
        });

        it("reads a JSON string", () => {
            expect(toMapPlace('{"lng": 120.1, "lat": 30.2, "name": "A"}')).toMatchObject({name: "A", lng: 120.1, lat: 30.2});
        });

        it("reads the raw AMap tip older versions stored, as GCJ02", () => {
            const place = toMapPlace({name: "West Lake", district: "Hangzhou", location: {lng: "120.14", lat: "30.25"}});
            expect(place).toMatchObject({name: "West Lake", address: "Hangzhou", lng: 120.14, lat: 30.25, crs: Crs.GCJ02});
        });

        it("names a place by its address, then by its coordinates", () => {
            expect(toMapPlace({address: "Road 1", lng: 1, lat: 2}).name).toBe("Road 1");
            expect(toMapPlace({lng: 1, lat: 2}).name).toBe("1,2");
        });

        it.each([
            [null],
            [""],
            ["{broken"],
            [{name: "no coords"}],
            [{lng: "abc", lat: 1}],
            [{lng: 0, lat: 0}]
        ])("rejects %j", raw => {
            expect(toMapPlace(raw)).toBeNull();
        });

        it("converts into the target system", () => {
            const raw = {lng: 116.397428, lat: 39.90923, crs: "GCJ02"};
            const place = toMapPlace(raw, Crs.BD09);
            const expected = gcj02ToBd09(raw);
            expect(place.crs).toBe(Crs.BD09);
            expect(place.lng).toBeCloseTo(expected.lng, 10);
            expect(place.lat).toBeCloseTo(expected.lat, 10);
        });

        it("does not convert when already in the target system", () => {
            expect(toMapPlace({lng: 1.5, lat: 2.5, crs: "BD09"}, Crs.BD09)).toMatchObject({lng: 1.5, lat: 2.5});
        });
    });

    it.each([
        [MapProvider.AMAP, Crs.GCJ02],
        [MapProvider.TENCENT, Crs.GCJ02],
        [MapProvider.BAIDU, Crs.BD09],
        [MapProvider.GOOGLE, Crs.WGS84],
        [MapProvider.OSM, Crs.WGS84],
        [MapProvider.TIANDITU, Crs.WGS84]
    ])("providerCrs(%s) is %s", (provider, crs) => {
        expect(providerCrs(provider)).toBe(crs);
    });
});
