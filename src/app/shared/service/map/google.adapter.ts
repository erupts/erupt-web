import {EruptMap, LngLat, MapConfig, MapOptions, MapPlace, MarkerItem} from "@shared/model/map.model";
import {loadSdk, PIN_HEIGHT, pinElement} from "./sdk.util";

declare const google: any;
declare const markerClusterer: any;

const DEFAULT_CENTER: LngLat = {lng: 0, lat: 20};

let sdk: Promise<void>;

function load(config: MapConfig): Promise<void> {
    sdk ??= loadSdk("https://maps.googleapis.com/maps/api/js?libraries=places,marker&loading=async&key=" + encodeURIComponent(config.key), "__eruptGMapReady")
        .then(() => loadSdk("https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js"));
    return sdk;
}

export async function create(el: HTMLElement, options: MapOptions, config: MapConfig): Promise<EruptMap> {
    await load(config);
    return new GoogleMap(el, options, config);
}

class GoogleMap implements EruptMap {

    private readonly el: HTMLElement;

    private readonly map: any;

    private readonly info: any;

    private markers: any[] = [];

    private cluster: any;

    private geocoder: any;

    constructor(el: HTMLElement, options: MapOptions, config: MapConfig) {
        this.el = el;
        const center = options.center || DEFAULT_CENTER;
        this.map = new google.maps.Map(el, {
            zoom: options.zoom ?? 2,
            center: {lat: center.lat, lng: center.lng},
            // advanced markers (html pins) need a map id; Google's demo id renders the default style
            mapId: config.mapId || 'DEMO_MAP_ID',
            colorScheme: options.dark ? 'DARK' : 'LIGHT',
            zoomControl: !!options.controls,
            scaleControl: !!options.controls,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });
        this.info = new google.maps.InfoWindow({pixelOffset: new google.maps.Size(0, -PIN_HEIGHT)});
    }

    setMarkers(items: MarkerItem[], cluster?: boolean) {
        this.clearMarkers();
        this.markers = items.map(item => {
            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: {lat: item.position.lat, lng: item.position.lng},
                content: pinElement(item.color),
                title: item.title || ''
            });
            marker.addListener('click', () => item.onClick?.(item));
            return marker;
        });
        if (!this.markers.length) return;
        if (cluster) {
            this.cluster = new markerClusterer.MarkerClusterer({map: this.map, markers: this.markers});
        } else {
            this.markers.forEach(m => m.map = this.map);
        }
    }

    clearMarkers() {
        if (this.cluster) {
            this.cluster.clearMarkers();
            this.cluster.setMap(null);
            this.cluster = null;
        }
        this.markers.forEach(m => m.map = null);
        this.markers = [];
        this.closeInfo();
    }

    fitView() {
        if (this.markers.length) {
            const bounds = new google.maps.LatLngBounds();
            this.markers.forEach(m => bounds.extend(m.position));
            this.map.fitBounds(bounds, 40);
        }
    }

    setCenter(pos: LngLat, zoom?: number) {
        this.map.setCenter({lat: pos.lat, lng: pos.lng});
        if (zoom != null) this.map.setZoom(zoom);
    }

    openInfo(html: string, pos: LngLat) {
        this.info.setContent(html);
        this.info.setPosition({lat: pos.lat, lng: pos.lng});
        this.info.open({map: this.map});
    }

    closeInfo() {
        this.info.close();
    }

    onClick(handler: (pos: LngLat) => void) {
        this.map.addListener('click', e => handler({lng: e.latLng.lng(), lat: e.latLng.lat()}));
    }

    async search(keyword: string): Promise<MapPlace[]> {
        try {
            const {places} = await google.maps.places.Place.searchByText({
                textQuery: keyword,
                fields: ['id', 'displayName', 'formattedAddress', 'location'],
                maxResultCount: 10
            });
            return places.filter(p => p.location).map(p => ({
                id: p.id,
                name: p.displayName,
                address: p.formattedAddress,
                lng: p.location.lng(),
                lat: p.location.lat()
            }));
        } catch {
            return [];
        }
    }

    async reverseGeocode(pos: LngLat): Promise<string | null> {
        this.geocoder ??= new google.maps.Geocoder();
        try {
            const {results} = await this.geocoder.geocode({location: {lat: pos.lat, lng: pos.lng}});
            return results[0]?.formatted_address || null;
        } catch {
            return null;
        }
    }

    destroy() {
        this.clearMarkers();
        google.maps.event.clearInstanceListeners(this.map);
        this.el.innerHTML = '';
    }

}
