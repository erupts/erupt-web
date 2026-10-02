import {Injectable} from "@angular/core";
import {EruptMap, MapAdapter, MapOptions, MapPlace, MapProvider, providerCrs, toMapPlace} from "@shared/model/map.model";
import {Crs} from "@shared/model/crs";
import {WindowModel} from "@shared/model/window.model";

// each adapter is its own lazy chunk: only the configured vendor's code is ever fetched
const ADAPTERS: Record<MapProvider, () => Promise<MapAdapter>> = {
    [MapProvider.AMAP]: () => import('./amap.adapter'),
    [MapProvider.BAIDU]: () => import('./baidu.adapter'),
    [MapProvider.TENCENT]: () => import('./tencent.adapter'),
    [MapProvider.TIANDITU]: () => import('./leaflet.adapter'),
    [MapProvider.GOOGLE]: () => import('./google.adapter'),
    [MapProvider.OSM]: () => import('./leaflet.adapter')
};

@Injectable({providedIn: 'root'})
export class MapService {

    /**
     * Whether eruptSiteConfig.map carries what the configured vendor needs.
     */
    configured(): boolean {
        const cfg = WindowModel.map;
        if (!ADAPTERS[cfg?.provider]) return false;
        switch (cfg.provider) {
            case MapProvider.OSM:
                return true;
            case MapProvider.AMAP:
                return !!cfg.key && !!cfg.securityJsCode;
            default:
                return !!cfg.key;
        }
    }

    /**
     * The coordinate system of the configured vendor: what its SDK expects and returns.
     */
    crs(): Crs {
        return providerCrs(WindowModel.map?.provider);
    }

    /**
     * A stored location expressed in the configured vendor's coordinate system.
     */
    toPlace(raw: any): MapPlace | null {
        return toMapPlace(raw, this.crs());
    }

    /**
     * A place the vendor produced, tagged with its coordinate system for storage.
     */
    stamp(place: MapPlace): MapPlace {
        return {...place, crs: this.crs()};
    }

    async create(el: HTMLElement, options: MapOptions = {}): Promise<EruptMap> {
        const cfg = WindowModel.map;
        const adapter = await ADAPTERS[cfg.provider]();
        return adapter.create(el, {
            center: cfg.center,
            dark: document.documentElement.classList.contains('dark'),
            ...options
        }, cfg);
    }

}
