import {EruptMap, LngLat, MapConfig, MapOptions, MapPlace, MarkerItem} from "@shared/model/map.model";
import {BUBBLE_SIZE, bubbleSvg, loadSdk, PIN_HEIGHT, PIN_WIDTH, pinDataUrl, svgDataUrl} from "./sdk.util";

declare const TMap: any;

const DEFAULT_CENTER: LngLat = {lng: 116.404, lat: 39.915};

let sdk: Promise<void>;

function load(config: MapConfig): Promise<void> {
    sdk ??= loadSdk("https://map.qq.com/api/gljs?v=1.exp&libraries=service&key=" + encodeURIComponent(config.key), "__eruptTMapReady");
    return sdk;
}

export async function create(el: HTMLElement, options: MapOptions, config: MapConfig): Promise<EruptMap> {
    await load(config);
    return new TencentMap(el, options, config);
}

class TencentMap implements EruptMap {

    private readonly map: any;

    private readonly info: any;

    private items: MarkerItem[] = [];

    // single markers (plain mode, or the unclustered points in cluster mode)
    private layer: any;

    // cluster bubbles
    private bubbles: any;

    private cluster: any;

    private suggestion: any;

    private geocoder: any;

    constructor(el: HTMLElement, options: MapOptions, config: MapConfig) {
        const center = options.center || DEFAULT_CENTER;
        this.map = new TMap.Map(el, {
            center: new TMap.LatLng(center.lat, center.lng),
            zoom: options.zoom ?? 4,
            showControl: !!options.controls,
            mapStyleId: options.dark && config.darkStyleId || undefined
        });
        this.info = new TMap.InfoWindow({map: this.map, position: this.map.getCenter(), content: '', offset: {x: 0, y: -PIN_HEIGHT}});
        this.info.close();
    }

    setMarkers(items: MarkerItem[], cluster?: boolean) {
        this.clearMarkers();
        this.items = items;
        if (!items.length) return;
        if (cluster) {
            // the cluster only groups: it hands back the groups and we draw both pins and bubbles
            this.cluster = new TMap.MarkerCluster({
                map: this.map,
                enableDefaultStyle: false,
                minimumClusterSize: 2,
                gridSize: 60,
                zoomOnClick: true,
                geometries: items.map((item, i) => ({id: String(i), position: this.latLng(item.position)}))
            });
            this.cluster.on('cluster_changed', () => this.renderClusters());
        } else {
            this.layer = this.pins(items.map((item, i) => ({item, id: String(i)})));
        }
    }

    private renderClusters() {
        this.layer?.setMap(null);
        this.bubbles?.setMap(null);
        const singles: { item: MarkerItem; id: string }[] = [];
        const groups: any[] = [];
        for (const c of this.cluster.getClusters()) {
            if (c.geometries.length === 1) {
                const id = c.geometries[0].id;
                singles.push({item: this.items[Number(id)], id});
            } else {
                groups.push({id: 'g' + groups.length, styleId: 'n' + c.geometries.length, position: c.center, count: c.geometries.length});
            }
        }
        this.layer = this.pins(singles);
        const styles = {};
        for (const g of groups) {
            styles[g.styleId] ??= new TMap.MarkerStyle({
                width: BUBBLE_SIZE, height: BUBBLE_SIZE, anchor: {x: BUBBLE_SIZE / 2, y: BUBBLE_SIZE / 2}, src: svgDataUrl(bubbleSvg(g.count))
            });
        }
        this.bubbles = new TMap.MultiMarker({map: this.map, styles, geometries: groups});
    }

    private pins(entries: { item: MarkerItem; id: string }[]) {
        const styles = {};
        const geometries = entries.map(({item, id}) => {
            const styleId = 'c' + (item.color || '');
            styles[styleId] ??= new TMap.MarkerStyle({
                width: PIN_WIDTH, height: PIN_HEIGHT, anchor: {x: PIN_WIDTH / 2, y: PIN_HEIGHT}, src: pinDataUrl(item.color)
            });
            return {id, styleId, position: this.latLng(item.position), properties: {title: item.title || ''}};
        });
        const layer = new TMap.MultiMarker({map: this.map, styles, geometries});
        layer.on('click', evt => {
            const item = this.items[Number(evt.geometry.id)];
            item?.onClick?.(item);
        });
        return layer;
    }

    clearMarkers() {
        this.cluster?.setMap(null);
        this.layer?.setMap(null);
        this.bubbles?.setMap(null);
        this.cluster = this.layer = this.bubbles = null;
        this.items = [];
        this.closeInfo();
    }

    fitView() {
        if (!this.items.length) return;
        const lngs = this.items.map(i => i.position.lng), lats = this.items.map(i => i.position.lat);
        const bounds = new TMap.LatLngBounds(
            new TMap.LatLng(Math.min(...lats), Math.min(...lngs)),
            new TMap.LatLng(Math.max(...lats), Math.max(...lngs)));
        this.map.fitBounds(bounds, {padding: 40});
    }

    setCenter(pos: LngLat, zoom?: number) {
        this.map.setCenter(this.latLng(pos));
        if (zoom != null) this.map.setZoom(zoom);
    }

    openInfo(html: string, pos: LngLat) {
        this.info.setContent(html);
        this.info.setPosition(this.latLng(pos));
        this.info.open();
    }

    closeInfo() {
        this.info.close();
    }

    onClick(handler: (pos: LngLat) => void) {
        this.map.on('click', evt => handler({lng: evt.latLng.lng, lat: evt.latLng.lat}));
    }

    async search(keyword: string): Promise<MapPlace[]> {
        this.suggestion ??= new TMap.service.Suggestion({pageSize: 10});
        try {
            const {data} = await this.suggestion.getSuggestions({keyword});
            return (data || []).filter(d => d.location).map(d => ({
                id: d.id, name: d.title, address: d.address, lng: d.location.lng, lat: d.location.lat
            }));
        } catch {
            return [];
        }
    }

    async reverseGeocode(pos: LngLat): Promise<string | null> {
        this.geocoder ??= new TMap.service.Geocoder();
        try {
            const {result} = await this.geocoder.getLocation({location: this.latLng(pos)});
            return result?.formatted_addresses?.recommend || result?.address || null;
        } catch {
            return null;
        }
    }

    destroy() {
        this.clearMarkers();
        this.map.destroy();
    }

    private latLng(pos: LngLat) {
        return new TMap.LatLng(pos.lat, pos.lng);
    }

}
