import {EruptMap, LngLat, MapConfig, MapOptions, MapPlace, MapProvider, MarkerItem} from "@shared/model/map.model";
import {loadCss, loadSdk, PIN_HEIGHT, PIN_WIDTH, pinSvg} from "./sdk.util";

/**
 * Leaflet on raster tiles: OpenStreetMap (or any XYZ source via `tileUrl`) and 天地图 WMTS.
 * Place search / reverse geocoding go to Nominatim or the 天地图 web services.
 */
declare const L: any;

const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/";
const CLUSTER = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/";

const DEFAULT_CENTER: Record<string, LngLat> = {
    [MapProvider.TIANDITU]: {lng: 105, lat: 35},
    [MapProvider.OSM]: {lng: 0, lat: 20}
};

let sdk: Promise<void>;

function load(): Promise<void> {
    if (!sdk) {
        loadCss(LEAFLET + "leaflet.css");
        loadCss(CLUSTER + "MarkerCluster.css");
        loadCss(CLUSTER + "MarkerCluster.Default.css");
        sdk = loadSdk(LEAFLET + "leaflet.js").then(() => loadSdk(CLUSTER + "leaflet.markercluster.js"));
    }
    return sdk;
}

export async function create(el: HTMLElement, options: MapOptions, config: MapConfig): Promise<EruptMap> {
    await load();
    return new LeafletMap(el, options, config);
}

// place search and reverse geocoding for a tile source
interface Geo {
    search(keyword: string): Promise<MapPlace[]>;

    reverse(pos: LngLat): Promise<string | null>;
}

const nominatim: Geo = {
    async search(keyword) {
        const list = await getJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&q=${encodeURIComponent(keyword)}`);
        return (list || []).map(r => ({
            id: String(r.place_id), name: r.name || r.display_name, address: r.display_name, lng: Number(r.lon), lat: Number(r.lat)
        }));
    },
    async reverse(pos) {
        const r = await getJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat}&lon=${pos.lng}`);
        return r?.display_name || null;
    }
};

function tianditu(tk: string): Geo {
    const key = encodeURIComponent(tk);
    return {
        async search(keyword) {
            const post = {keyWord: keyword, level: 12, mapBound: '-180,-90,180,90', queryType: 1, start: 0, count: 10};
            const r = await getJson(`https://api.tianditu.gov.cn/v2/search?type=query&tk=${key}&postStr=${encodeURIComponent(JSON.stringify(post))}`);
            return (r?.pois || []).map(p => {
                const [lng, lat] = String(p.lonlat).split(',').map(Number);
                return {id: p.hotPointID, name: p.name, address: p.address, lng, lat};
            });
        },
        async reverse(pos) {
            const post = {lon: pos.lng, lat: pos.lat, ver: 1};
            const r = await getJson(`https://api.tianditu.gov.cn/geocoder?type=geocode&tk=${key}&postStr=${encodeURIComponent(JSON.stringify(post))}`);
            return r?.result?.formatted_address || null;
        }
    };
}

async function getJson(url: string): Promise<any> {
    try {
        const res = await fetch(url);
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

class LeafletMap implements EruptMap {

    private readonly map: any;

    private readonly geo: Geo;

    private markers: any[] = [];

    private cluster: any;

    constructor(el: HTMLElement, options: MapOptions, config: MapConfig) {
        const center = options.center || DEFAULT_CENTER[config.provider];
        this.map = L.map(el, {zoomControl: !!options.controls}).setView([center.lat, center.lng], options.zoom ?? 4);
        if (options.controls) {
            L.control.scale().addTo(this.map);
        }
        if (config.provider === MapProvider.TIANDITU) {
            const tk = encodeURIComponent(config.key);
            const wmts = (layer: string) => `https://t{s}.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`;
            const opts = {subdomains: '01234567', maxZoom: 18, attribution: '© 天地图'};
            L.tileLayer(wmts('vec'), opts).addTo(this.map);
            L.tileLayer(wmts('cva'), opts).addTo(this.map);
            this.geo = tianditu(config.key);
        } else {
            L.tileLayer(config.tileUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19, attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
            this.geo = nominatim;
        }
        if (options.dark) {
            // raster tiles have no dark variant: invert them
            this.map.getPane('tilePane').style.filter = 'invert(1) hue-rotate(180deg) brightness(.9) contrast(.9)';
        }
    }

    setMarkers(items: MarkerItem[], cluster?: boolean) {
        this.clearMarkers();
        this.markers = items.map(item => {
            const marker = L.marker([item.position.lat, item.position.lng], {
                title: item.title || '',
                icon: L.divIcon({html: pinSvg(item.color), className: '', iconSize: [PIN_WIDTH, PIN_HEIGHT], iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT]})
            });
            marker.on('click', () => item.onClick?.(item));
            return marker;
        });
        if (!this.markers.length) return;
        if (cluster) {
            this.cluster = L.markerClusterGroup({maxClusterRadius: 60});
            this.cluster.addLayers(this.markers);
            this.map.addLayer(this.cluster);
        } else {
            this.markers.forEach(m => m.addTo(this.map));
        }
    }

    clearMarkers() {
        if (this.cluster) {
            this.map.removeLayer(this.cluster);
            this.cluster = null;
        }
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
        this.closeInfo();
    }

    fitView() {
        if (this.markers.length) {
            this.map.fitBounds(L.latLngBounds(this.markers.map(m => m.getLatLng())), {padding: [40, 40]});
        }
    }

    setCenter(pos: LngLat, zoom?: number) {
        this.map.setView([pos.lat, pos.lng], zoom ?? this.map.getZoom());
    }

    openInfo(html: string, pos: LngLat) {
        L.popup({offset: [0, -PIN_HEIGHT]}).setLatLng([pos.lat, pos.lng]).setContent(html).openOn(this.map);
    }

    closeInfo() {
        this.map.closePopup();
    }

    onClick(handler: (pos: LngLat) => void) {
        this.map.on('click', e => handler({lng: e.latlng.lng, lat: e.latlng.lat}));
    }

    search(keyword: string): Promise<MapPlace[]> {
        return this.geo.search(keyword);
    }

    reverseGeocode(pos: LngLat): Promise<string | null> {
        return this.geo.reverse(pos);
    }

    destroy() {
        this.clearMarkers();
        this.map.remove();
    }

}
