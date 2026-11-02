import {EruptMap, LngLat, MapConfig, MapOptions, MapPlace, MarkerItem} from "@shared/model/map.model";
import {loadSdk, PIN_HEIGHT, PIN_WIDTH, pinSvg} from "./sdk.util";

declare const AMap: any;

let sdk: Promise<void>;

function load(config: MapConfig): Promise<void> {
    if (!sdk) {
        window["_AMapSecurityConfig"] = {securityJsCode: config.securityJsCode};
        sdk = loadSdk("https://webapi.amap.com/maps?v=2.0&key=" + encodeURIComponent(config.key))
            .then(() => new Promise<void>(resolve => AMap.plugin([
                'AMap.ToolBar', 'AMap.Scale', 'AMap.MarkerCluster', 'AMap.AutoComplete', 'AMap.Geocoder'
            ], resolve)));
    }
    return sdk;
}

export async function create(el: HTMLElement, options: MapOptions, config: MapConfig): Promise<EruptMap> {
    await load(config);
    return new AmapMap(el, options);
}

class AmapMap implements EruptMap {

    private readonly map: any;

    private readonly info: any;

    private markers: any[] = [];

    private cluster: any;

    private autoComplete: any;

    private geocoder: any;

    constructor(el: HTMLElement, options: MapOptions) {
        this.map = new AMap.Map(el, {
            zoom: options.zoom ?? 4,
            center: options.center && [options.center.lng, options.center.lat],
            resizeEnable: true,
            mapStyle: options.dark ? 'amap://styles/dark' : undefined
        });
        if (options.controls) {
            this.map.addControl(new AMap.ToolBar());
            this.map.addControl(new AMap.Scale());
        }
        this.info = new AMap.InfoWindow({autoMove: true, offset: {x: 0, y: -PIN_HEIGHT}});
    }

    setMarkers(items: MarkerItem[], cluster?: boolean) {
        this.clearMarkers();
        this.markers = items.map(item => {
            const marker = new AMap.Marker({position: [item.position.lng, item.position.lat], extData: item});
            this.dress(marker, item);
            marker.on('click', () => item.onClick?.(item));
            return marker;
        });
        if (!this.markers.length) return;
        if (cluster) {
            this.cluster = new AMap.MarkerCluster(this.map, items.map(item => ({lnglat: [item.position.lng, item.position.lat], item})), {
                gridSize: 60,
                // the cluster draws single points with its own markers: dress those instead
                renderMarker: ctx => {
                    const item: MarkerItem = ctx.data[0].item;
                    this.dress(ctx.marker, item);
                    ctx.marker.setExtData(item);
                    // the cluster reuses its markers across re-renders: bind the click once
                    if (!ctx.marker.__eruptBound) {
                        ctx.marker.__eruptBound = true;
                        ctx.marker.on('click', () => {
                            const current: MarkerItem = ctx.marker.getExtData();
                            current.onClick?.(current);
                        });
                    }
                }
            });
        } else {
            this.map.add(this.markers);
        }
    }

    private dress(marker: any, item: MarkerItem) {
        marker.setContent(pinSvg(item.color));
        marker.setOffset(new AMap.Pixel(-PIN_WIDTH / 2, -PIN_HEIGHT));
        marker.setTitle(item.title || '');
    }

    clearMarkers() {
        if (this.cluster) {
            this.cluster.setMap(null);
            this.cluster = null;
        }
        if (this.markers.length) {
            this.map.remove(this.markers);
            this.markers = [];
        }
        this.closeInfo();
    }

    fitView() {
        if (this.markers.length) {
            this.map.setFitView(this.cluster ? undefined : this.markers, false, [40, 40, 40, 40]);
        }
    }

    setCenter(pos: LngLat, zoom?: number) {
        this.map.setZoomAndCenter(zoom ?? this.map.getZoom(), [pos.lng, pos.lat]);
    }

    openInfo(html: string, pos: LngLat) {
        this.info.setContent(html);
        this.info.open(this.map, [pos.lng, pos.lat]);
    }

    closeInfo() {
        this.info.close();
    }

    onClick(handler: (pos: LngLat) => void) {
        this.map.on('click', e => handler({lng: e.lnglat.getLng(), lat: e.lnglat.getLat()}));
    }

    search(keyword: string): Promise<MapPlace[]> {
        this.autoComplete ??= new AMap.AutoComplete({city: ''});
        return new Promise(resolve => this.autoComplete.search(keyword, (status, result) => {
            const tips: any[] = status === 'complete' ? result.tips || [] : [];
            // tips without a position (bare districts) cannot be placed
            resolve(tips.filter(t => t.location?.lng).map(t => ({
                id: t.id,
                name: t.name,
                address: (t.district || '') + (typeof t.address === 'string' ? t.address : ''),
                lng: t.location.lng,
                lat: t.location.lat
            })));
        }));
    }

    reverseGeocode(pos: LngLat): Promise<string | null> {
        this.geocoder ??= new AMap.Geocoder();
        return new Promise(resolve => this.geocoder.getAddress([pos.lng, pos.lat], (status, result) =>
            resolve(status === 'complete' && result.info === 'OK' ? result.regeocode.formattedAddress : null)));
    }

    destroy() {
        this.clearMarkers();
        this.map.destroy();
    }

}
