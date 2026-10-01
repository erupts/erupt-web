/**
 * Vendor-neutral map contract shared by the EditType.MAP editor and the map view.
 * The vendor SDK is loaded from its CDN at runtime; only the adapter code ships with the app.
 */
export enum MapProvider {
    AMAP = "amap",
    BAIDU = "baidu",
    TENCENT = "tencent",
    TIANDITU = "tianditu",
    GOOGLE = "google",
    // OpenStreetMap tiles on Leaflet: no key needed
    OSM = "osm"
}

// eruptSiteConfig.map
export interface MapConfig {
    provider: MapProvider;
    key: string;
    // amap only: the web security code paired with the key
    securityJsCode?: string;
    // google only: the map ID advanced markers require (defaults to Google's demo id)
    mapId?: string;
    // baidu / tencent: a custom style id from the vendor console, used while the dark theme is on
    darkStyleId?: string;
    // osm only: an XYZ tile url template replacing OpenStreetMap's, e.g. a Mapbox / CartoDB raster source
    tileUrl?: string;
    // where an empty map opens; each vendor has its own default
    center?: LngLat;
}

export interface LngLat {
    lng: number;
    lat: number;
}

// what an EditType.MAP field stores
export interface MapPlace extends LngLat {
    id?: string;
    name: string;
    address?: string;
}

export interface MarkerItem {
    position: LngLat;
    // pin color; the primary blue when omitted
    color?: string;
    // hover text
    title?: string;
    data?: any;
    onClick?: (item: MarkerItem) => void;
}

export interface MapOptions {
    zoom?: number;
    center?: LngLat;
    // vendor controls: zoom, scale
    controls?: boolean;
    dark?: boolean;
}

export interface EruptMap {
    // replaces every marker; cluster groups nearby ones
    setMarkers(items: MarkerItem[], cluster?: boolean): void;
    clearMarkers(): void;
    // zooms to hold every marker
    fitView(): void;
    setCenter(pos: LngLat, zoom?: number): void;
    openInfo(html: string, pos: LngLat): void;
    closeInfo(): void;
    onClick(handler: (pos: LngLat) => void): void;
    // place suggestions for a keyword
    search(keyword: string): Promise<MapPlace[]>;
    // formatted address of a position; null when the vendor knows none
    reverseGeocode(pos: LngLat): Promise<string | null>;
    destroy(): void;
}

export interface MapAdapter {
    create(el: HTMLElement, options: MapOptions, config: MapConfig): Promise<EruptMap>;
}

/**
 * Reads a stored location: the current {lng, lat, name, address} shape, the raw AMap tip
 * older versions stored ({location: {lng, lat}, district}), or a JSON string of either.
 */
export function toMapPlace(raw: any): MapPlace | null {
    if (!raw) return null;
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch {
            return null;
        }
    }
    const lng = Number(raw.lng ?? raw.location?.lng);
    const lat = Number(raw.lat ?? raw.location?.lat);
    if (!isFinite(lng) || !isFinite(lat) || (lng === 0 && lat === 0)) return null;
    const address = typeof raw.address === 'string' ? raw.address : raw.district;
    return {id: raw.id, name: raw.name || address || `${lng},${lat}`, address, lng, lat};
}
