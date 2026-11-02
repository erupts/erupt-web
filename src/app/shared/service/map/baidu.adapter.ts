import {EruptMap, LngLat, MapConfig, MapOptions, MapPlace, MarkerItem} from "@shared/model/map.model";
import {loadSdk, PIN_HEIGHT, PIN_WIDTH, pinDataUrl} from "./sdk.util";

declare const BMapGL: any;
declare const BMapGLLib: any;
declare const BMAP_STATUS_SUCCESS: any;

const DEFAULT_CENTER: LngLat = {lng: 116.404, lat: 39.915};

let sdk: Promise<void>;

function load(config: MapConfig): Promise<void> {
    sdk ??= loadSdk("https://api.map.baidu.com/api?v=1.0&type=webgl&ak=" + encodeURIComponent(config.key), "__eruptBMapReady")
        .then(() => loadSdk("https://mapopen.cdn.bcebos.com/github/BMapGLLib/MarkerClusterer/src/MarkerClusterer.min.js"));
    return sdk;
}

export async function create(el: HTMLElement, options: MapOptions, config: MapConfig): Promise<EruptMap> {
    await load(config);
    return new BaiduMap(el, options, config);
}

class BaiduMap implements EruptMap {

    private readonly map: any;

    private markers: any[] = [];

    private cluster: any;

    private localSearch: any;

    private geocoder: any;

    constructor(el: HTMLElement, options: MapOptions, config: MapConfig) {
        this.map = new BMapGL.Map(el);
        this.map.enableScrollWheelZoom(true);
        const center = options.center || DEFAULT_CENTER;
        this.map.centerAndZoom(new BMapGL.Point(center.lng, center.lat), options.zoom ?? 5);
        if (options.controls) {
            this.map.addControl(new BMapGL.ZoomControl());
            this.map.addControl(new BMapGL.ScaleControl());
        }
        if (options.dark && config.darkStyleId) {
            this.map.setMapStyleV2({styleId: config.darkStyleId});
        }
    }

    setMarkers(items: MarkerItem[], cluster?: boolean) {
        this.clearMarkers();
        this.markers = items.map(item => {
            const marker = new BMapGL.Marker(this.point(item.position), {
                title: item.title || '',
                icon: new BMapGL.Icon(pinDataUrl(item.color), new BMapGL.Size(PIN_WIDTH, PIN_HEIGHT), {
                    anchor: new BMapGL.Size(PIN_WIDTH / 2, PIN_HEIGHT)
                })
            });
            marker.addEventListener('click', () => item.onClick?.(item));
            return marker;
        });
        if (!this.markers.length) return;
        if (cluster) {
            this.cluster = new BMapGLLib.MarkerClusterer(this.map, {markers: this.markers, gridSize: 60});
        } else {
            this.markers.forEach(m => this.map.addOverlay(m));
        }
    }

    clearMarkers() {
        if (this.cluster) {
            this.cluster.clearMarkers();
            this.cluster = null;
        }
        this.markers.forEach(m => this.map.removeOverlay(m));
        this.markers = [];
        this.closeInfo();
    }

    fitView() {
        if (this.markers.length) {
            this.map.setViewport(this.markers.map(m => m.getPosition()), {margins: [40, 40, 40, 40]});
        }
    }

    setCenter(pos: LngLat, zoom?: number) {
        this.map.centerAndZoom(this.point(pos), zoom ?? this.map.getZoom());
    }

    openInfo(html: string, pos: LngLat) {
        this.map.openInfoWindow(new BMapGL.InfoWindow(html, {offset: new BMapGL.Size(0, -PIN_HEIGHT)}), this.point(pos));
    }

    closeInfo() {
        this.map.closeInfoWindow();
    }

    onClick(handler: (pos: LngLat) => void) {
        this.map.addEventListener('click', e => handler({lng: e.latlng.lng, lat: e.latlng.lat}));
    }

    search(keyword: string): Promise<MapPlace[]> {
        return new Promise(resolve => {
            // one LocalSearch per query: its completion callback is fixed at construction
            this.localSearch = new BMapGL.LocalSearch(this.map, {
                pageCapacity: 10,
                onSearchComplete: results => {
                    const places: MapPlace[] = [];
                    if (this.localSearch.getStatus() === BMAP_STATUS_SUCCESS) {
                        for (let i = 0; i < results.getCurrentNumberOfPois(); i++) {
                            const poi = results.getPoi(i);
                            if (poi.point) {
                                places.push({id: poi.uid, name: poi.title, address: poi.address, lng: poi.point.lng, lat: poi.point.lat});
                            }
                        }
                    }
                    resolve(places);
                }
            });
            this.localSearch.search(keyword);
        });
    }

    reverseGeocode(pos: LngLat): Promise<string | null> {
        this.geocoder ??= new BMapGL.Geocoder();
        return new Promise(resolve => this.geocoder.getLocation(this.point(pos), result => resolve(result?.address || null)));
    }

    destroy() {
        this.clearMarkers();
        this.map.destroy();
    }

    private point(pos: LngLat) {
        return new BMapGL.Point(pos.lng, pos.lat);
    }

}
