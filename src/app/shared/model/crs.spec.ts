import {bd09ToGcj02, convertCrs, Crs, gcj02ToBd09, gcj02ToWgs84, wgs84ToGcj02} from "@shared/model/crs";

// About 1e-5 degree is roughly one meter
const METER = 1e-5;

describe("crs", () => {

    const tiananmen = {lng: 116.397428, lat: 39.90923};

    it("offsets a point inside China by a few hundred meters", () => {
        const gcj = wgs84ToGcj02(tiananmen);
        const shift = Math.hypot(gcj.lng - tiananmen.lng, gcj.lat - tiananmen.lat);
        expect(shift).toBeGreaterThan(100 * METER);
        expect(shift).toBeLessThan(1000 * METER);
    });

    it("leaves points outside China untouched", () => {
        const paris = {lng: 2.3522, lat: 48.8566};
        expect(wgs84ToGcj02(paris)).toEqual(paris);
        expect(gcj02ToWgs84(paris)).toEqual(paris);
    });

    it("round-trips WGS84 → GCJ02 → WGS84 within a meter", () => {
        const back = gcj02ToWgs84(wgs84ToGcj02(tiananmen));
        expect(Math.abs(back.lng - tiananmen.lng)).toBeLessThan(METER);
        expect(Math.abs(back.lat - tiananmen.lat)).toBeLessThan(METER);
    });

    it("round-trips GCJ02 → BD09 → GCJ02 within a meter", () => {
        const back = bd09ToGcj02(gcj02ToBd09(tiananmen));
        expect(Math.abs(back.lng - tiananmen.lng)).toBeLessThan(METER);
        expect(Math.abs(back.lat - tiananmen.lat)).toBeLessThan(METER);
    });

    it("returns the same point when both systems match", () => {
        expect(convertCrs(tiananmen, Crs.BD09, Crs.BD09)).toBe(tiananmen);
    });

    it.each([
        [Crs.WGS84, Crs.BD09],
        [Crs.BD09, Crs.WGS84],
        [Crs.GCJ02, Crs.WGS84],
        [Crs.WGS84, Crs.GCJ02]
    ])("convertCrs %s → %s → back stays within a meter", (from, to) => {
        const back = convertCrs(convertCrs(tiananmen, from, to), to, from);
        expect(Math.abs(back.lng - tiananmen.lng)).toBeLessThan(METER);
        expect(Math.abs(back.lat - tiananmen.lat)).toBeLessThan(METER);
    });
});
