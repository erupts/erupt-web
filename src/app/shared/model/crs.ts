import {LngLat} from "./map.model";

/**
 * Coordinate reference systems used by the supported map vendors. Values match the Java
 * enum xyz.erupt.annotation.model.Location.Crs, which is what a stored location carries.
 */
export enum Crs {
    // AMap, Tencent: China's encrypted datum
    GCJ02 = "GCJ02",
    // Baidu: a further offset on top of GCJ02
    BD09 = "BD09",
    // Google, OpenStreetMap, Tianditu: the GPS datum
    WGS84 = "WGS84"
}

// locations stored before the crs field existed came from AMap
export const LEGACY_CRS = Crs.GCJ02;

const PI = Math.PI;
const X_PI = PI * 3000.0 / 180.0;
// Krasovsky 1940 ellipsoid used by the GCJ-02 obfuscation
const A = 6378245.0;
const EE = 0.00669342162296594323;

function outOfChina(p: LngLat): boolean {
    return p.lng < 72.004 || p.lng > 137.8347 || p.lat < 0.8293 || p.lat > 55.8271;
}

function transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLng(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}

// the GCJ-02 offset of a WGS-84 point; zero outside China where GCJ-02 equals WGS-84
function delta(p: LngLat): LngLat {
    if (outOfChina(p)) return {lng: 0, lat: 0};
    let dLat = transformLat(p.lng - 105.0, p.lat - 35.0);
    let dLng = transformLng(p.lng - 105.0, p.lat - 35.0);
    const radLat = p.lat / 180.0 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
    return {lng: dLng, lat: dLat};
}

export function wgs84ToGcj02(p: LngLat): LngLat {
    const d = delta(p);
    return {lng: p.lng + d.lng, lat: p.lat + d.lat};
}

// iterative inverse: accurate to well under a meter after two rounds
export function gcj02ToWgs84(p: LngLat): LngLat {
    let guess: LngLat = {...p};
    for (let i = 0; i < 3; i++) {
        const d = delta(guess);
        guess = {lng: p.lng - d.lng, lat: p.lat - d.lat};
    }
    return guess;
}

export function gcj02ToBd09(p: LngLat): LngLat {
    const z = Math.sqrt(p.lng * p.lng + p.lat * p.lat) + 0.00002 * Math.sin(p.lat * X_PI);
    const theta = Math.atan2(p.lat, p.lng) + 0.000003 * Math.cos(p.lng * X_PI);
    return {lng: z * Math.cos(theta) + 0.0065, lat: z * Math.sin(theta) + 0.006};
}

export function bd09ToGcj02(p: LngLat): LngLat {
    const x = p.lng - 0.0065, y = p.lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
    return {lng: z * Math.cos(theta), lat: z * Math.sin(theta)};
}

/**
 * Converts a point between any two systems, going through GCJ-02 when needed.
 */
export function convertCrs(p: LngLat, from: Crs, to: Crs): LngLat {
    if (from === to) return p;
    const gcj = from === Crs.GCJ02 ? p : from === Crs.BD09 ? bd09ToGcj02(p) : wgs84ToGcj02(p);
    return to === Crs.GCJ02 ? gcj : to === Crs.BD09 ? gcj02ToBd09(gcj) : gcj02ToWgs84(gcj);
}
